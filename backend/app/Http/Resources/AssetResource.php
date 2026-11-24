<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * JsonResource meneruskan atribut model secara magic lewat __get().
 *
 * @property mixed $id
 * @property mixed $project_id
 * @property mixed $type
 * @property mixed $type_label
 * @property mixed $name
 * @property mixed $provider
 * @property mixed $renewal_cost
 * @property mixed $billing_cycle
 * @property mixed $billing_cycle_label
 * @property mixed $start_date
 * @property mixed $expired_date
 * @property mixed $auto_renew
 * @property mixed $status
 * @property mixed $status_label
 * @property mixed $metadata
 * @property mixed $notes
 * @property mixed $created_at
 * @property mixed $updated_at
 *
 * @method int daysUntilExpiry()
 */
class AssetResource extends JsonResource
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
            'project_id' => $this->project_id,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'name' => $this->name,
            'provider' => $this->provider,
            'renewal_cost' => $this->renewal_cost,
            'billing_cycle' => $this->billing_cycle?->value,
            'billing_cycle_label' => $this->billing_cycle?->label(),
            'start_date' => $this->start_date?->toDateString(),
            'expired_date' => $this->expired_date?->toDateString(),
            'days_until_expiry' => $this->daysUntilExpiry(),
            'auto_renew' => $this->auto_renew,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'metadata' => $this->metadata,
            'notes' => $this->notes,
            'project' => new ProjectResource($this->whenLoaded('project')),
            'renewals' => RenewalResource::collection($this->whenLoaded('renewals')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
