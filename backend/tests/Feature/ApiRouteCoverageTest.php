<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Cakupan route API: setiap resource harus terdaftar di /api dan /api/v1,
 * dan parameter numerik tidak boleh menerima nilai bebas (audit #74 / 3.5 / 3.7).
 */
class ApiRouteCoverageTest extends TestCase
{
    use LazilyRefreshDatabase;

    /**
     * @return array<string, list<string>>
     */
    private function resourceActions(): array
    {
        return [
            'clients' => ['index', 'store', 'show', 'update', 'destroy'],
            'projects' => ['index', 'store', 'show', 'update', 'destroy'],
            'assets' => ['index', 'store', 'show', 'update', 'destroy'],
            'renewals' => ['show', 'update', 'destroy'],
            'users' => ['index', 'store', 'show', 'update', 'destroy'],
        ];
    }

    public function test_every_resource_route_is_registered_for_legacy_and_versioned_prefix(): void
    {
        foreach (['' => '/api', 'v1.' => '/api/v1'] as $prefix => $base) {
            foreach ($this->resourceActions() as $resource => $actions) {
                foreach ($actions as $action) {
                    $this->assertTrue(
                        Route::has($prefix.$resource.'.'.$action),
                        "Route {$prefix}{$resource}.{$action} harus terdaftar ({$base})"
                    );
                }
            }

            foreach (['auth.register', 'auth.login', 'auth.logout', 'auth.me', 'dashboard.summary',
                'assets.renewals.index', 'assets.renewals.store', 'notifications.index',
                'notifications.read-all', 'notifications.read', 'reports.expiring-assets', 'renewals.invoice'] as $name) {
                $this->assertTrue(Route::has($prefix.$name), "Route {$prefix}{$name} harus terdaftar ({$base})");
            }
        }
    }

    public function test_non_numeric_route_parameters_are_rejected(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (['/api', '/api/v1'] as $base) {
            $this->actingAs($admin)->getJson("{$base}/clients/not-a-number")->assertNotFound();
            $this->actingAs($admin)->getJson("{$base}/projects/abc")->assertNotFound();
            $this->actingAs($admin)->getJson("{$base}/assets/xyz")->assertNotFound();
            $this->actingAs($admin)->getJson("{$base}/renewals/abc")->assertNotFound();
            $this->actingAs($admin)->getJson("{$base}/users/abc")->assertNotFound();
            $this->actingAs($admin)->postJson("{$base}/notifications/abc/read")->assertNotFound();
        }
    }

    public function test_versioned_routes_resolve_to_same_controller_actions(): void
    {
        $admin = User::factory()->admin()->create();

        $legacy = $this->actingAs($admin)->getJson('/api/clients')->assertOk()->json();
        $versioned = $this->actingAs($admin)->getJson('/api/v1/clients')->assertOk()->json();

        $this->assertSame(
            array_keys($legacy),
            array_keys($versioned),
            'Bentuk respons /api dan /api/v1 harus identik.'
        );
    }
}
