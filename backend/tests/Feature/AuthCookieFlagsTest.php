<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\TestCase;

class AuthCookieFlagsTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_auth_cookie_is_secure_http_only_and_same_site(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertOk();

        $token = $this->cookie($response, 'token');
        $this->assertTrue($token->isSecure());
        $this->assertTrue($token->isHttpOnly());
        $this->assertSame('lax', $token->getSameSite());
        $this->assertSame('/', $token->getPath());

        // Cookie CSRF harus bisa dibaca JS, tetapi tetap Secure + SameSite.
        $csrf = $this->cookie($response, 'XSRF-TOKEN');
        $this->assertTrue($csrf->isSecure());
        $this->assertFalse($csrf->isHttpOnly());
        $this->assertSame('lax', $csrf->getSameSite());
    }

    private function cookie(TestResponse $response, string $name): Cookie
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie;
            }
        }

        $this->fail("Cookie {$name} tidak ditemukan pada respons.");
    }
}
