<?php

namespace Tests\Feature;

use App\Enums\AssetType;
use App\Enums\UserRole;
use App\Models\Asset;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

/**
 * Kontrak HTTP API: 201 + Location, format error seragam, paginasi, request id,
 * dan normalisasi input (audit #68 5.6 / 5.7 / 5.11 / 12.3 / 4.9).
 */
class ApiContractTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_store_endpoints_return_201_with_location_header(): void
    {
        $admin = User::factory()->admin()->create();
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();
        $asset = Asset::factory()->for($project)->create();

        $cases = [
            ['/api/clients', ['name' => '  Klien Baru  '], 'clients'],
            ['/api/v1/clients', ['name' => 'Klien Versi'], 'clients'],
            ['/api/projects', ['client_id' => $client->id, 'name' => ' Proyek Baru '], 'projects'],
            ['/api/assets', [
                'project_id' => $project->id,
                'type' => AssetType::Domain->value,
                'name' => ' Baru-Example ',
                'start_date' => '2026-01-01',
                'expired_date' => '2027-01-01',
            ], 'assets'],
            ['/api/users', [
                'name' => 'User Baru',
                'email' => ' BARU@Example.COM ',
                'password' => 'rahasia123',
                'role' => UserRole::Staff->value,
            ], 'users'],
            ['/api/assets/'.$asset->id.'/renewals', [
                'renewal_date' => '2026-11-20',
                'new_expired_date' => '2027-11-20',
                'cost' => 125000,
            ], 'renewals'],
        ];

        foreach ($cases as [$path, $payload, $resource]) {
            $response = $this->actingAs($admin)->postJson($path, $payload);

            $response->assertCreated();
            $location = $response->headers->get('Location');
            $this->assertNotNull($location, "Location wajib ada untuk {$path}");
            $this->assertMatchesRegularExpression('#/api/(v1/)?'.$resource.'/[0-9]+$#', $location);
        }

        $this->assertDatabaseHas('clients', ['name' => 'Klien Baru']);
        $this->assertDatabaseHas('projects', ['name' => 'Proyek Baru']);
        $this->assertDatabaseHas('assets', ['name' => 'Baru-Example']);
        $this->assertDatabaseHas('users', ['email' => 'baru@example.com']);
    }

    public function test_validation_and_not_found_errors_share_a_consistent_shape(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson('/api/clients', [])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['name']]);

        $this->actingAs($admin)->getJson('/api/clients/999999')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_unauthenticated_error_shape_is_consistent(): void
    {
        $this->getJson('/api/clients')
            ->assertUnauthorized()
            ->assertJsonStructure(['message']);
    }

    public function test_list_endpoints_share_pagination_shape_without_duplicate_keys(): void
    {
        $admin = User::factory()->admin()->create();
        Client::factory()->count(5)->create();

        $first = $this->actingAs($admin)->getJson('/api/clients?per_page=2&page=1')
            ->assertOk()
            ->assertJsonStructure(['data', 'links' => ['first', 'last', 'prev', 'next'], 'meta' => ['current_page', 'per_page', 'total']])
            ->json();
        $second = $this->actingAs($admin)->getJson('/api/clients?per_page=2&page=2')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta'])
            ->json();

        $idsFirst = array_column($first['data'], 'id');
        $idsSecond = array_column($second['data'], 'id');

        $this->assertCount(2, $idsFirst);
        $this->assertCount(2, $idsSecond);
        $this->assertSame([], array_intersect($idsFirst, $idsSecond), 'Halaman 1 dan 2 tidak boleh duplikat.');
    }

    public function test_request_id_is_returned_and_preserves_valid_client_value(): void
    {
        $admin = User::factory()->admin()->create();

        $generated = $this->actingAs($admin)->getJson('/api/clients')->assertOk();
        $this->assertNotSame('', (string) $generated->headers->get('X-Request-ID'));

        $preserved = $this->actingAs($admin)
            ->withHeader('X-Request-ID', 'trace-123')
            ->getJson('/api/clients')
            ->assertOk();
        $this->assertSame('trace-123', $preserved->headers->get('X-Request-ID'));
    }

    public function test_cross_field_validation_messages_are_explicit(): void
    {
        $admin = User::factory()->admin()->create();
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();

        $this->actingAs($admin)->postJson('/api/projects', [
            'client_id' => $client->id,
            'name' => 'Proyek Mundur',
            'start_date' => '2026-12-01',
            'end_date' => '2026-11-01',
        ])->assertUnprocessable()->assertJsonValidationErrors('end_date');

        $this->actingAs($admin)->postJson('/api/assets', [
            'project_id' => $project->id,
            'type' => AssetType::Domain->value,
            'name' => 'Mundur',
            'start_date' => '2026-12-01',
            'expired_date' => '2026-11-01',
        ])->assertUnprocessable()->assertJsonValidationErrors('expired_date');
    }

    public function test_login_failure_messages_are_identical_for_unknown_email_and_wrong_password(): void
    {
        User::factory()->create(['email' => 'ada@example.test']);

        // Dua percobaan masih di bawah ambang throttle: 5/min.
        $unknown = $this->postJson('/api/auth/login', [
            'email' => 'tidakada@example.test',
            'password' => 'salah',
        ])->assertUnprocessable()->json('errors.email.0');

        $wrong = $this->postJson('/api/auth/login', [
            'email' => 'ada@example.test',
            'password' => 'salah',
        ])->assertUnprocessable()->json('errors.email.0');

        $this->assertSame($unknown, $wrong);
        $this->assertSame('Email atau password salah.', $unknown);
    }
}
