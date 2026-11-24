<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

/**
 * Rule::exists harus menolak ID soft-deleted dan dibatasi tenant/parent (audit 4.6).
 */
class ScopedExistsTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_store_project_rejects_soft_deleted_client(): void
    {
        $admin = User::factory()->admin()->create();
        $active = Client::factory()->create();
        $deleted = Client::factory()->create();
        $deleted->delete();

        $this->actingAs($admin);

        $this->postJson('/api/projects', [
            'client_id' => $deleted->id,
            'name' => 'Proyek klien terhapus',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('client_id');

        $this->postJson('/api/projects', [
            'client_id' => $active->id,
            'name' => 'Proyek klien aktif',
        ])->assertCreated();

        $this->assertDatabaseHas('projects', ['name' => 'Proyek klien aktif']);
    }

    public function test_store_asset_rejects_soft_deleted_project(): void
    {
        $admin = User::factory()->admin()->create();
        $client = Client::factory()->create();
        $active = Project::factory()->for($client)->create();
        $deleted = Project::factory()->for($client)->create();
        $deleted->delete();

        $this->actingAs($admin);

        $this->postJson('/api/assets', [
            'project_id' => $deleted->id,
            'type' => 'domain',
            'name' => 'Aset proyek terhapus',
            'expired_date' => now()->addYear()->toDateString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('project_id');

        $this->postJson('/api/assets', [
            'project_id' => $active->id,
            'type' => 'domain',
            'name' => 'Aset proyek aktif',
            'expired_date' => now()->addYear()->toDateString(),
        ])->assertCreated();

        $this->assertDatabaseHas('assets', ['name' => 'Aset proyek aktif']);
    }
}
