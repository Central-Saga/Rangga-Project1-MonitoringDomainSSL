<?php

namespace App\Models\Concerns;

use App\Services\AuditTrail;
use Illuminate\Database\Eloquent\Model;

/**
 * Pasang pada model domain yang mutasinya tergolong kritikal.
 */
trait RecordsAuditTrail
{
    public static function bootRecordsAuditTrail(): void
    {
        static::created(function (Model $model): void {
            app(AuditTrail::class)->record('created', $model, $model->getAttributes());
        });

        static::updated(function (Model $model): void {
            app(AuditTrail::class)->record('updated', $model, $model->getChanges());
        });

        static::deleted(function (Model $model): void {
            app(AuditTrail::class)->record('deleted', $model, ['id' => $model->getKey()]);
        });
    }
}
