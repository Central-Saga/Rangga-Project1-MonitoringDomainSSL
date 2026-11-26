<?php

namespace App\Services;

use App\Data\AuditChanges;
use App\Data\AuditFields;
use App\Enums\UserRole;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Audit trail mutasi kritikal dengan rantai hash (tamper-evident).
 *
 * Setiap baris menyimpan hash sha256 dari fields + hash baris sebelumnya.
 * Mengubah atau menghapus baris mana pun memutus rantai; `verify()`
 * mengembalikan daftar baris yang tidak konsisten.
 *
 * Input berupa DTO (`AuditChanges`, `AuditFields`) — bukan array mentah
 * (audit #94).
 */
class AuditTrail
{
    public function record(string $event, Model $subject, ?AuditChanges $changes = null): AuditLog
    {
        $now = now();
        $actor = auth()->user();
        $actorId = auth()->id();
        $role = $actor?->role;

        $values = [
            'previous_hash' => (string) (AuditLog::query()->latest('id')->value('hash') ?? str_repeat('0', 64)),
            'event' => $event,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => (string) $subject->getKey(),
            'actor_id' => $actorId === null ? null : (string) $actorId,
            'actor_role' => $role instanceof UserRole ? $role->value : null,
            'changes' => ($changes ?? new AuditChanges)->sanitized()->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => mb_substr((string) request()->userAgent(), 0, 512),
            'created_at' => $now->toIso8601String(),
        ];

        // Urutan kunci di atas harus sama dengan fieldsFromLog() agar hash lama
        // tetap terverifikasi setelah refactor DTO.
        $hash = AuditFields::from($values)->fingerprint();
        $values['hash'] = $hash;
        $log = AuditLog::create($values);

        DB::table('audit_log_state')->updateOrInsert(['key' => 'chain'], [
            'head_hash' => $hash,
            'entry_count' => AuditLog::query()->count(),
        ]);

        return $log;
    }

    /**
     * @return array{ok: bool, count: int, errors: list<string>}
     */
    public function verify(): array
    {
        $previousHash = str_repeat('0', 64);
        $errors = [];
        $count = 0;

        AuditLog::query()->orderBy('id')->chunkById(500, function (Collection $logs) use (&$previousHash, &$errors, &$count): void {
            foreach ($logs as $log) {
                $count++;

                if (! hash_equals($log->previous_hash, $previousHash)) {
                    $errors[] = "Baris {$log->id}: previous_hash tidak cocok dengan baris sebelumnya.";
                }

                if (! hash_equals($log->hash, $this->fieldsFromLog($log)->fingerprint())) {
                    $errors[] = "Baris {$log->id}: hash tidak cocok dengan isi baris (data diubah).";
                }

                $previousHash = $log->hash;
            }
        });

        $state = DB::table('audit_log_state')->where('key', 'chain')->first();

        if ($state !== null) {
            if (! hash_equals((string) $state->head_hash, $previousHash)) {
                $errors[] = 'Head hash tidak cocok — ada entri terakhir yang dihapus atau diganti.';
            }

            if ((int) $state->entry_count !== $count) {
                $errors[] = "Jumlah entri {$count} tidak cocok dengan state tersimpan {$state->entry_count}.";
            }
        }

        return ['ok' => $errors === [], 'count' => $count, 'errors' => $errors];
    }

    private function fieldsFromLog(AuditLog $log): AuditFields
    {
        /** @var Carbon $createdAt */
        $createdAt = $log->created_at;

        return AuditFields::from([
            'previous_hash' => $log->previous_hash,
            'event' => $log->event,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'actor_id' => $log->actor_id === null ? null : (string) $log->actor_id,
            'actor_role' => $log->actor_role,
            'changes' => (new AuditChanges(is_array($log->changes) ? $log->changes : []))->sanitized()->toArray(),
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'created_at' => $createdAt->toIso8601String(),
        ]);
    }
}
