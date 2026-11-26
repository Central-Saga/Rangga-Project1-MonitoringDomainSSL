<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Urutan middleware pada route API (audit #95 / backend 3.8).
 *
 * Aturan: autentikasi -> throttle -> binding. Jika binding berjalan lebih
 * awal, ID milik tenant lain bisa terselesaikan sebelum hak akses dicek.
 */
class RouteMiddlewareOrderTest extends TestCase
{
    /**
     * @return list<int>
     */
    private function positionsOf(string $routeName): array
    {
        $route = Route::getRoutes()->getByName($routeName);
        $this->assertNotNull($route, "Route {$routeName} harus terdaftar.");

        $positions = ['auth' => null, 'throttle' => null, 'binding' => null];

        foreach ($route->gatherMiddleware() as $index => $middleware) {
            $name = is_string($middleware) ? $middleware : '';

            if (str_contains($name, 'Authenticate') || str_starts_with($name, 'auth:')) {
                $positions['auth'] ??= $index;
            } elseif (str_contains($name, 'ThrottleRequests') || str_starts_with($name, 'throttle:')) {
                $positions['throttle'] ??= $index;
            } elseif (str_contains($name, 'SubstituteBindings')) {
                $positions['binding'] ??= $index;
            }
        }

        return $positions;
    }

    public function test_protected_routes_run_auth_before_throttle_before_binding(): void
    {
        foreach (['v1.clients.index', 'v1.clients.show', 'assets.index', 'assets.renewals.index'] as $name) {
            $positions = $this->positionsOf($name);

            $this->assertNotNull($positions['auth'], "{$name} harus punya middleware auth.");
            $this->assertNotNull($positions['throttle'], "{$name} harus punya middleware throttle.");
            $this->assertNotNull($positions['binding'], "{$name} harus punya middleware binding.");
            $this->assertLessThan($positions['throttle'], $positions['auth'], "{$name}: auth harus sebelum throttle.");
            $this->assertLessThan($positions['binding'], $positions['throttle'], "{$name}: throttle harus sebelum binding.");
        }
    }

    public function test_public_login_is_throttled_but_not_authenticated(): void
    {
        foreach (['v1.auth.login', 'auth.login'] as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route, "Route {$name} harus terdaftar.");

            $middleware = array_values(array_filter(
                $route->gatherMiddleware(),
                static fn ($value): bool => is_string($value)
            ));

            $this->assertContains('throttle:5,1', $middleware);
            $this->assertNotContains('auth:sanctum', $middleware);
        }
    }
}
