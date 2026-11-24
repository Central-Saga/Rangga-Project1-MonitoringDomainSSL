<?php

namespace App\Http\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Respons 201 konsisten dengan header Location untuk semua endpoint create (audit 5.6).
 */
trait CreatedResponse
{
    protected function created(JsonResource $resource, string $routeName, mixed $parameters = []): JsonResponse
    {
        return $resource->response()
            ->setStatusCode(201)
            ->header('Location', route($routeName, $parameters));
    }
}
