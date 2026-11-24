<?php

namespace App\Http;

use App\Services\HealthCheckService;
use Illuminate\Foundation\Http\HealthCheck as BaseHealthCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Menggantikan /up bawaan yang hanya mengembalikan {"status":"up"}.
 * Respons baru memuat hasil pemeriksaan DB, Redis, dan queue (audit #108).
 */
class HealthCheck extends BaseHealthCheck
{
    public function __construct(private readonly HealthCheckService $service) {}

    public function __invoke(Request $request): JsonResponse
    {
        $checks = $this->service->checks();
        $healthy = ! collect($checks)->contains(
            static fn (array $check): bool => ($check['ok'] ?? false) !== true
        );

        return response()->json([
            'status' => $healthy ? 'up' : 'down',
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }
}
