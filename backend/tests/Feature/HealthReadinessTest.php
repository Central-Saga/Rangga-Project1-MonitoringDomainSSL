<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Redis;
use RuntimeException;
use Tests\TestCase;

class HealthReadinessTest extends TestCase
{
    public function test_up_exposes_deep_database_redis_and_queue_checks(): void
    {
        $this->getJson('/up')
            ->assertOk()
            ->assertJsonPath('status', 'up')
            ->assertJsonStructure([
                'status',
                'checks' => [
                    'database' => ['ok', 'connection'],
                    'redis' => ['ok', 'skipped'],
                    'queue' => ['ok', 'connection', 'size', 'failed_jobs_table'],
                ],
            ]);
    }

    public function test_ready_endpoint_reports_degraded_when_redis_fails(): void
    {
        config()->set('cache.default', 'redis');
        Redis::shouldReceive('ping')->once()->andThrow(new RuntimeException('Redis down'));

        $this->getJson('/health/ready')
            ->assertStatus(503)
            ->assertJsonPath('status', 'down')
            ->assertJsonPath('checks.redis.ok', false);
    }

    public function test_built_in_up_probe_also_fails_when_redis_fails(): void
    {
        config()->set('queue.default', 'redis');
        Redis::shouldReceive('ping')->once()->andThrow(new RuntimeException('Redis down'));

        $this->getJson('/up')
            ->assertStatus(503)
            ->assertJsonPath('status', 'down');
    }
}
