<?php

namespace Tests\Feature;

use App\Jobs\SendExpiringAssetAlert;
use App\Models\Asset;
use App\Models\User;
use App\Notifications\ExpiringAssetAlert;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class QueueReadinessTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_duplicate_expiry_alerts_are_coalesced_by_unique_job(): void
    {
        Queue::fake();

        $admin = User::factory()->admin()->create();
        $asset = Asset::factory()->create(['expired_date' => now()->addDays(7)]);
        $notification = new ExpiringAssetAlert($asset, 'h7');

        SendExpiringAssetAlert::dispatch($admin, $notification);
        SendExpiringAssetAlert::dispatch($admin, $notification);

        Queue::assertPushed(SendExpiringAssetAlert::class, 1);
    }

    public function test_unique_id_differs_between_recipients_and_alert_levels(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();
        $asset = Asset::factory()->create(['expired_date' => now()->addDays(7)]);

        $h7 = new SendExpiringAssetAlert($admin, new ExpiringAssetAlert($asset, 'h7'));
        $h30 = new SendExpiringAssetAlert($admin, new ExpiringAssetAlert($asset, 'h30'));
        $other = new SendExpiringAssetAlert($staff, new ExpiringAssetAlert($asset, 'h7'));

        $this->assertNotSame($h7->uniqueId(), $h30->uniqueId());
        $this->assertNotSame($h7->uniqueId(), $other->uniqueId());
        $this->assertSame(86_400, $h7->uniqueFor());
    }

    public function test_scheduler_prunes_failed_jobs(): void
    {
        $commands = collect($this->app->make(Schedule::class)->events())
            ->map(static fn ($event): string => (string) $event->command)
            ->implode("\n");

        $this->assertStringContainsString('queue:prune-failed --hours=48', $commands);
        $this->assertStringContainsString('assets:check-expiry', $commands);
    }

    public function test_compose_declares_queue_worker_and_scheduler_services(): void
    {
        $compose = (string) file_get_contents(dirname(__DIR__, 3).'/compose.yaml');

        $this->assertMatchesRegularExpression('/^  queue:/m', $compose);
        $this->assertMatchesRegularExpression('/^  scheduler:/m', $compose);
        $this->assertStringContainsString('"queue:work", "redis"', $compose);
        $this->assertStringContainsString('"schedule:work"', $compose);
    }
}
