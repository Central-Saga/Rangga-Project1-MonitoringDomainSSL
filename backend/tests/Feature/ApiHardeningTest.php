<?php

namespace Tests\Feature;

use App\Http\Middleware\TrustProxies;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiHardeningTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_per_page_is_capped_and_non_numeric_is_rejected(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->getJson('/api/clients?per_page=100000')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 50);

        $this->actingAs($user)->getJson('/api/clients?per_page=abc')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    public function test_unknown_sort_and_filter_are_rejected(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->getJson('/api/assets?sort=password')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');

        $this->actingAs($user)->getJson('/api/assets?filter[pwd]=1')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('filter.pwd');
    }

    public function test_sanctum_token_expiration_is_configured(): void
    {
        $this->assertNotNull(config('sanctum.expiration'));
        $this->assertSame(10080, config('sanctum.expiration'));
    }

    public function test_logout_revokes_all_tokens(): void
    {
        $user = User::factory()->admin()->create();
        $first = $user->createToken('first')->plainTextToken;
        $second = $user->createToken('second')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$first}")
            ->postJson('/api/auth/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$first}")
            ->getJson('/api/auth/me')->assertUnauthorized();
        $this->withHeader('Authorization', "Bearer {$second}")
            ->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_changing_password_revokes_all_tokens(): void
    {
        $user = User::factory()->admin()->create([
            'password' => Hash::make('rahasia123'),
        ]);
        $oldToken = $user->createToken('old')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$oldToken}")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'rahasia123',
                'password' => 'rahasia456',
                'password_confirmation' => 'rahasia456',
            ])->assertOk();

        $this->assertSame(0, $user->tokens()->count());
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$oldToken}")
            ->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_soft_deleted_client_does_not_block_new_client_with_same_email(): void
    {
        $first = Client::factory()->create(['email' => 'sama@example.com']);
        $first->delete();

        $second = Client::factory()->create(['email' => 'sama@example.com']);

        $this->assertNotSame($first->id, $second->id);
        $this->assertSoftDeleted($first);
    }

    public function test_client_model_exposes_explicit_casts(): void
    {
        $client = Client::factory()->create();
        $casts = $client->getCasts();

        $this->assertArrayHasKey('email', $casts);
        $this->assertArrayHasKey('created_at', $casts);
        $this->assertArrayHasKey('deleted_at', $casts);
    }

    public function test_trust_proxies_uses_forwarded_for_header(): void
    {
        $request = Request::create('/', 'GET', [], [], [], [
            'HTTP_X_FORWARDED_FOR' => '203.0.113.10',
            'REMOTE_ADDR' => '127.0.0.1',
        ]);

        $middleware = new TrustProxies;
        $middleware->handle($request, function (Request $request): void {
            $this->assertSame('203.0.113.10', $request->ip());
        });
    }
}
