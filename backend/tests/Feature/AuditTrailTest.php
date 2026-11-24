<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_critical_mutations_are_recorded_with_actor_and_changes(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $client = Client::factory()->create(['name' => 'Nama awal']);
        $client->update(['name' => 'Nama ubah']);

        $logs = AuditLog::query()->orderBy('id')->get();

        $this->assertSame(['created', 'created', 'updated'], $logs->pluck('event')->all());
        $this->assertSame($admin->id, (int) $logs->last()->actor_id);
        $this->assertSame('admin', $logs->last()->actor_role);
        $this->assertSame('Nama ubah', $logs->last()->changes['name']);
        $this->assertSame($client->getKey(), (int) $logs->last()->subject_id);
    }

    public function test_sensitive_fields_are_never_persisted_in_audit_changes(): void
    {
        User::factory()->create(['password' => 'rahasia-123']);

        $changes = (array) AuditLog::query()->latest('id')->first()->changes;

        $this->assertArrayNotHasKey('password', $changes);
        $this->assertArrayNotHasKey('remember_token', $changes);
    }

    public function test_verify_command_detects_tampering_and_deletion(): void
    {
        User::factory()->admin()->create();
        Client::factory()->create();

        $this->artisan('audit:verify')->assertExitCode(0);

        $last = AuditLog::query()->latest('id')->firstOrFail();
        DB::table('audit_logs')->where('id', $last->id)->update([
            'changes' => json_encode(['name' => 'disuntik']),
        ]);
        $this->artisan('audit:verify')->assertExitCode(1);

        DB::table('audit_logs')->where('id', $last->id)->delete();
        $this->artisan('audit:verify')->assertExitCode(1);
    }
}
