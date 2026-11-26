<?php

namespace Tests\Feature;

use App\Data\AuditChanges;
use App\Data\AuditFields;
use App\Data\LoginCredentials;
use App\Data\RegisterData;
use App\Data\RenewalData;
use App\Enums\AssetType;
use App\Models\Asset;
use App\Models\Client;
use App\Models\Project;
use App\Models\Renewal;
use App\Models\User;
use App\Services\AssetExpiryService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use ReflectionNamedType;
use Tests\TestCase;

/**
 * Pembuktian ambang #94 (0 array param di Services) dan #101
 * (0 get()/all() unbounded di app, query dibatasi).
 */
class UnboundedQueryTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_no_service_method_accepts_an_array_parameter(): void
    {
        $files = glob(app_path('Services/*.php')) ?: [];
        $this->assertNotSame([], $files);

        foreach ($files as $file) {
            $class = 'App\\Services\\'.basename($file, '.php');
            $reflection = new ReflectionClass($class);

            foreach ($reflection->getMethods() as $method) {
                if ($method->getDeclaringClass()->getName() !== $class) {
                    continue;
                }

                foreach ($method->getParameters() as $parameter) {
                    $type = $parameter->getType();
                    $isArray = $type instanceof ReflectionNamedType && $type->getName() === 'array';

                    $this->assertFalse($isArray, "{$class}::{$method->getName()} masih menerima array.");
                }
            }
        }
    }

    public function test_app_sources_have_no_unbounded_get_or_all_calls(): void
    {
        $violations = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(app_path()));

        foreach ($iterator as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $contents = (string) file_get_contents($file->getPathname());
            if (preg_match('/->get\s*\(\s*\)|->all\s*\(\s*\)|::all\s*\(\s*\)/', $contents) === 1) {
                $violations[] = str_replace(app_path().'/', 'app/', $file->getPathname());
            }
        }

        $this->assertSame([], $violations, 'Temukan pemanggilan get()/all() tanpa batas.');
    }

    public function test_dtos_normalize_validated_payloads_and_keep_audit_hash_formula(): void
    {
        $this->assertSame([
            'name' => 'Andi',
            'email' => 'andi@example.com',
            'password' => 'rahasia123',
        ], RegisterData::from([
            'name' => 'Andi',
            'email' => 'andi@example.com',
            'password' => 'rahasia123',
        ])->toArray());

        $credentials = LoginCredentials::from(['email' => 'a@example.com', 'password' => 'rahasia']);
        $this->assertSame('a@example.com', $credentials->email);
        $this->assertSame('rahasia', $credentials->password);

        $renewal = RenewalData::from(['new_expired_date' => '2027-01-01', 'cost' => 1500]);
        $this->assertSame('2027-01-01', $renewal->newExpiredDate);
        $this->assertSame(1500, $renewal->cost);
        $this->assertNull($renewal->status);

        $changes = (new AuditChanges(['password' => 'rahasia', 'nested' => ['token' => 'x', 'name' => 'Budi']]))->sanitized();
        $this->assertSame(['nested' => ['name' => 'Budi']], $changes->toArray());

        $fields = ['event' => 'updated', 'changes' => ['name' => 'Budi'], 'hash' => null];
        $legacy = hash('sha256', json_encode($fields, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        $this->assertSame($legacy, AuditFields::from($fields)->fingerprint());
    }

    public function test_renewal_history_is_paginated_and_per_page_is_capped(): void
    {
        $admin = User::factory()->admin()->create();
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();
        $asset = Asset::factory()->for($project)->create();
        Renewal::factory()->count(60)->for($asset)->create();

        $body = $this->actingAs($admin)
            ->getJson('/api/assets/'.$asset->id.'/renewals?per_page=999')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta' => ['current_page', 'per_page', 'total']])
            ->json();

        $this->assertSame(50, $body['meta']['per_page']);
        $this->assertSame(60, $body['meta']['total']);
        $this->assertCount(50, $body['data']);
    }

    public function test_report_and_expiry_queries_are_limited(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->staff()->create();
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();
        Asset::factory()->for($project)->create([
            'type' => AssetType::Domain,
            'expired_date' => now()->addDays(2),
        ]);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->actingAs($admin)->get('/api/reports/expiring-assets/pdf')->assertOk();
        app(AssetExpiryService::class)->check();

        $sql = strtolower(collect(DB::getQueryLog())->pluck('query')->implode("\n"));
        DB::disableQueryLog();

        $this->assertStringContainsString('limit 500', $sql, 'Laporan PDF wajib membatasi baris.');
        $this->assertSame(1, substr_count($sql, 'limit 500'), 'Query penerima alert wajib membatasi baris.');
    }

    public function test_dashboard_asset_type_counts_stay_within_the_enum(): void
    {
        $admin = User::factory()->admin()->create();
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();
        Asset::factory()->for($project)->count(4)->create();

        $body = $this->actingAs($admin)->getJson('/api/dashboard/summary')->assertOk()->json();
        $allowed = array_map(static fn (AssetType $type): string => $type->value, AssetType::cases());

        foreach (array_keys($body['summary']['assets_by_type']) as $type) {
            $this->assertContains($type, $allowed);
        }
    }
}
