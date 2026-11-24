<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class RoleMatrixTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_role_matrix_for_creating_clients(): void
    {
        $matrix = [
            'client' => [User::factory()->client(Client::factory()->create())->create(), 403],
            'staff' => [User::factory()->staff()->create(), 201],
            'admin' => [User::factory()->admin()->create(), 201],
        ];

        foreach ($matrix as $role => [$user, $expectedStatus]) {
            $response = $this->actingAs($user)->postJson('/api/clients', [
                'name' => "Klien {$role}",
            ]);

            $response->assertStatus($expectedStatus);
        }
    }

    public function test_role_matrix_for_reading_client_data(): void
    {
        $owner = Client::factory()->create();
        $other = Client::factory()->create();

        $client = User::factory()->client($owner)->create();
        $this->actingAs($client)->getJson("/api/clients/{$owner->id}")->assertOk();
        $this->actingAs($client)->getJson("/api/clients/{$other->id}")->assertForbidden();

        $staff = User::factory()->staff()->create();
        $this->actingAs($staff)->getJson("/api/clients/{$other->id}")->assertOk();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->getJson("/api/clients/{$other->id}")->assertOk();
    }

    public function test_role_matrix_for_updating_and_deleting_client_data(): void
    {
        $client = User::factory()->client(Client::factory()->create())->create();
        $target = Client::factory()->create();

        $this->actingAs($client)->putJson("/api/clients/{$target->id}", ['name' => 'Diubah'])
            ->assertForbidden();
        $this->actingAs($client)->deleteJson("/api/clients/{$target->id}")
            ->assertForbidden();

        $staff = User::factory()->staff()->create();
        $this->actingAs($staff)->putJson("/api/clients/{$target->id}", ['name' => 'Diubah Staff'])
            ->assertOk();
        $this->actingAs($staff)->deleteJson("/api/clients/{$target->id}")
            ->assertNoContent();

        $adminTarget = Client::factory()->create();
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->putJson("/api/clients/{$adminTarget->id}", ['name' => 'Diubah Admin'])
            ->assertOk();
        $this->actingAs($admin)->deleteJson("/api/clients/{$adminTarget->id}")
            ->assertNoContent();
    }
}
