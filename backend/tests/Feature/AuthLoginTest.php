<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_login_sets_http_only_auth_cookie_without_exposing_token(): void
    {
        $user = User::factory()->admin()->create(['email' => 'admin@example.com']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonMissingPath('token')
            ->assertCookie('token')
            ->assertCookie('XSRF-TOKEN');

        $this->assertCount(1, $user->tokens);
    }

    public function test_login_rejects_missing_credentials_with_validation_errors(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }
}
