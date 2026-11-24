<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Pemeriksaan mendalam untuk probe /up dan /health/ready (audit #108).
 */
class HealthCheckService
{
    /**
     * @return array{database: array<string, mixed>, redis: array<string, mixed>, queue: array<string, mixed>}
     */
    public function checks(): array
    {
        return [
            'database' => $this->database(),
            'redis' => $this->redis(),
            'queue' => $this->queue(),
        ];
    }

    public function isHealthy(): bool
    {
        foreach ($this->checks() as $check) {
            if (($check['ok'] ?? false) !== true) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    private function database(): array
    {
        try {
            DB::connection()->getPdo();

            return ['ok' => true, 'connection' => (string) config('database.default')];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $this->message($e)];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function redis(): array
    {
        $usesRedis = in_array('redis', [
            (string) config('cache.default'),
            (string) config('queue.default'),
            (string) config('session.driver'),
        ], true);

        if (! $usesRedis) {
            return ['ok' => true, 'skipped' => true, 'reason' => 'redis bukan driver aktif'];
        }

        try {
            return ['ok' => true, 'ping' => Redis::ping()];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $this->message($e)];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function queue(): array
    {
        try {
            $connection = (string) config('queue.default');

            return [
                'ok' => true,
                'connection' => $connection,
                'size' => Queue::connection()->size(),
                'failed_jobs_table' => Schema::hasTable('failed_jobs'),
            ];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $this->message($e)];
        }
    }

    private function message(Throwable $e): string
    {
        return app()->hasDebugModeEnabled() ? $e->getMessage() : 'layanan tidak tersedia';
    }
}
