<?php

namespace App\Services;

use App\Data\RenewalData;
use App\Enums\AssetStatus;
use App\Enums\RenewalStatus;
use App\Models\Asset;
use App\Models\Renewal;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Use case "catat perpanjangan": menulis renewal sekaligus memperbarui aset.
 *
 * Logika ini dipindahkan dari controller agar controller tetap tipis dan
 * kedua tulisan berada dalam satu transaksi database.
 */
class RenewalService
{
    public function record(Asset $asset, RenewalData $data, User $actor): Renewal
    {
        return DB::transaction(function () use ($asset, $data, $actor): Renewal {
            $renewal = $asset->renewals()->create([
                'renewed_by' => $actor->id,
                'renewal_date' => $data->renewalDate ?? now()->toDateString(),
                'previous_expired_date' => $asset->expired_date,
                'new_expired_date' => $data->newExpiredDate,
                'cost' => $data->cost ?? $asset->renewal_cost,
                'invoice_number' => $data->invoiceNumber,
                'payment_method' => $data->paymentMethod,
                'status' => $data->status ?? RenewalStatus::Paid->value,
                'notes' => $data->notes,
            ]);

            $asset->update([
                'expired_date' => $data->newExpiredDate,
                'status' => $asset->status === AssetStatus::Expired
                    ? AssetStatus::Active->value
                    : $asset->status->value,
            ]);

            return $renewal;
        });
    }
}
