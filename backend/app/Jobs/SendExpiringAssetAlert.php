<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\ExpiringAssetAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Kirim satu alert kedaluwarsa per (penerima, aset, level, tanggal expired).
 *
 * `ExpiringAssetAlert` adalah notification ShouldQueue; Laravel membungkusnya
 * di `SendQueuedNotifications` yang tidak memahami ShouldBeUnique. Job ini
 * menjadi pembungkus eksplisit sehingga duplicate dispatch dari scheduler
 * yang bertumpang tindih tidak mengirim email/database notification dobel
 * (audit #113).
 */
class SendExpiringAssetAlert implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $notifiable,
        public ExpiringAssetAlert $notification,
    ) {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        $this->notifiable->notifyNow($this->notification);
    }

    /**
     * Identitas unik: satu penerima tidak boleh menerima alert yang sama dua
     * kali untuk level dan tanggal kedaluwarsa yang identik.
     */
    public function uniqueId(): string
    {
        return implode(':', [
            $this->notifiable->getKey(),
            $this->notification->asset->getKey(),
            $this->notification->level,
            $this->notification->asset->expired_date->toDateString(),
        ]);
    }

    /**
     * Kunci unik bertahan 24 jam untuk melindungi retry worker yang
     * bertumpang tindih dengan siklus scheduler berikutnya.
     */
    public function uniqueFor(): int
    {
        return 86_400;
    }
}
