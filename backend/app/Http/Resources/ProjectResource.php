<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property mixed $id
 * @property mixed $client_id
 * @property mixed $name
 * @property mixed $description
 * @property mixed $status
 * @property mixed $status_label
 * @property mixed $start_date
 * @property mixed $end_date
 * @property mixed $created_at
 * @property mixed $updated_at
 */
class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'client' => new ClientResource($this->whenLoaded('client')),
            'assets_count' => $this->whenCounted('assets'),
            'assets' => AssetResource::collection($this->whenLoaded('assets')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
