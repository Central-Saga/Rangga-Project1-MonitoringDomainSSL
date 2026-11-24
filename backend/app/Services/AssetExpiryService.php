<?php

namespace App\Services;

use App\Enums\AssetStatus;
use App\Jobs\SendExpiringAssetAlert;
use App\Models\Asset;
use App\Models\User;
use App\Notifications\ExpiringAssetAlert;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;

/**
 * Use case pengecekan kedaluwarsa aset.
 *
 * Perubahan status aset dan notifikasi database ditulis dalam satu transaksi:
 * jika satu notifikasi gagal, status tidak ikut berubah.
 */
class AssetExpiryService
{
    /**
     * @return array{has_recipients: bool, sent: array{h30: int, h7: int, expired: int}}
     */
    public function check(): array
    {
        return DB::transaction(function (): array {
            // Tandai aset yang sudah lewat tanggal kedaluwarsa, meskipun belum ada penerima alert.
            Asset::query()
                ->where('status', AssetStatus::Active->value)
                ->pastDue()
                ->update(['status' => AssetStatus::Expired->value]);

            $recipients = User::query()->whereIn('role', ['admin', 'staff'])->get();
            $sent = ['h30' => 0, 'h7' => 0, 'expired' => 0];

            if ($recipients->isEmpty()) {
                return ['has_recipients' => false, 'sent' => $sent];
            }

            Asset::query()
                ->with('project')
                ->whereDate('expired_date', '<=', now()->addDays(30)->toDateString())
                ->chunk(100, function (Collection $assets) use ($recipients, &$sent): void {
                    foreach ($assets as $asset) {
                        $level = $this->alertLevelFor($asset);

                        if ($level === null || $this->alreadyAlerted($asset, $level)) {
                            continue;
                        }

                        foreach ($recipients as $recipient) {
                            // Job unik mencegah alert dobel bila scheduler/Worker
                            // bertumpang tindih (audit #113).
                            SendExpiringAssetAlert::dispatch(
                                $recipient,
                                new ExpiringAssetAlert($asset, $level)
                            );
                        }

                        $sent[$level]++;
                    }
                });

            return ['has_recipients' => true, 'sent' => $sent];
        });
    }

    /**
     * Tentukan tingkat alert berdasarkan sisa hari.
     */
    private function alertLevelFor(Asset $asset): ?string
    {
        $days = $asset->daysUntilExpiry();

        return match (true) {
            $days < 0 => 'expired',
            $days <= 7 => 'h7',
            $days <= 30 => 'h30',
            default => null,
        };
    }

    /**
     * Cegah alert ganda untuk kombinasi aset + level + tanggal expired yang sama.
     */
    private function alreadyAlerted(Asset $asset, string $level): bool
    {
        return DatabaseNotification::query()
            ->where('type', ExpiringAssetAlert::class)
            ->where('data->asset_id', $asset->id)
            ->where('data->level', $level)
            ->where('data->expired_date', $asset->expired_date->toDateString())
            ->exists();
    }
}
