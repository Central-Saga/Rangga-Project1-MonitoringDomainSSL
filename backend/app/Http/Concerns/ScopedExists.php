<?php

namespace App\Http\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * Rule::exists yang tidak menerima ID soft-deleted dan, untuk user client,
 * dibatasi hanya pada client/proyek miliknya sendiri (audit 4.6).
 *
 * Admin dan staff tetap bisa memilih client mana pun: itu bukan eskalasi
 * hak akses, melainkan kapabilitas role mereka yang memang disengaja.
 */
trait ScopedExists
{
    protected function clientExistsRule(): Exists
    {
        $rule = Rule::exists('clients', 'id')->whereNull('deleted_at');
        $user = $this->user();

        if ($user instanceof User && $user->isClient() && $user->client_id !== null) {
            $rule->where('id', $user->client_id);
        }

        return $rule;
    }

    protected function projectExistsRule(): Exists
    {
        $rule = Rule::exists('projects', 'id')->whereNull('deleted_at');
        $user = $this->user();

        if ($user instanceof User && $user->isClient() && $user->client_id !== null) {
            $rule->where('client_id', $user->client_id);
        }

        return $rule;
    }
}
