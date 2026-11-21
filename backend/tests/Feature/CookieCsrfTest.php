<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class CookieCsrfTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_cookie_authenticated_mutation_without_csrf_token_is_rejected(): void
    {
        $user = User::factory()->admin()->create();
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withCredentials()
            ->withUnencryptedCookie('token', $token)
            ->postJson('/api/clients', [
                'name' => 'Klien CSRF',
            ]);

        $response->assertStatus(419)->assertJsonPath('message', 'Token CSRF tidak valid.');
    }

    public function test_cookie_authenticated_mutation_with_csrf_token_is_allowed(): void
    {
        $user = User::factory()->admin()->create();
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withCredentials()
            ->withUnencryptedCookie('token', $token)
            ->withUnencryptedCookie('XSRF-TOKEN', 'csrf-token')
            ->withHeader('X-XSRF-TOKEN', 'csrf-token')
            ->postJson('/api/clients', [
                'name' => 'Klien CSRF',
            ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Klien CSRF');
    }
}
