<?php

namespace App\Console\Commands;

use App\Services\AssetExpiryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('assets:check-expiry')]
#[Description('Periksa aset yang akan kedaluwarsa dan kirim alert berjenjang (H-30, H-7, expired)')]
class CheckAssetExpiry extends Command
{
    public function __construct(private readonly AssetExpiryService $service)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $result = $this->service->check();

        if (! $result['has_recipients']) {
            $this->warn('Tidak ada user admin/staff sebagai penerima alert.');

            return self::SUCCESS;
        }

        $sent = $result['sent'];

        $this->info("Alert terkirim — H-30: {$sent['h30']}, H-7: {$sent['h7']}, Expired: {$sent['expired']}.");

        return self::SUCCESS;
    }
}
