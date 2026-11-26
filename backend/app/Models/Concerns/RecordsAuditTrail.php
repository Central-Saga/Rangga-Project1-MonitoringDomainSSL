<?php

namespace App\Models\Concerns;

use App\Data\AuditChanges;
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
            app(AuditTrail::class)->record('created', $model, new AuditChanges($model->getAttributes()));
        });

        static::updated(function (Model $model): void {
            app(AuditTrail::class)->record('updated', $model, new AuditChanges($model->getChanges()));
        });

        static::deleted(function (Model $model): void {
            app(AuditTrail::class)->record('deleted', $model, new AuditChanges(['id' => $model->getKey()]));
        });
    }
}
