<?php

namespace App\Console\Commands;

use App\Services\AuditTrail;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('audit:verify')]
#[Description('Verifikasi rantai hash audit_logs (deteksi perubahan/penghapusan baris)')]
class VerifyAuditTrail extends Command
{
    public function handle(AuditTrail $trail): int
    {
        $result = $trail->verify();

        if ($result['ok']) {
            $this->info("Audit trail valid — {$result['count']} entri, rantai hash utuh.");

            return self::SUCCESS;
        }

        foreach ($result['errors'] as $error) {
            $this->error($error);
        }

        $this->error("Audit trail TIDAK valid — {$result['count']} entri, ".count($result['errors']).' masalah.');

        return self::FAILURE;
    }
}
