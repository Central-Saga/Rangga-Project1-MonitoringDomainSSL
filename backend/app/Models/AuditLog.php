<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Baris audit append-only. Rantai `previous_hash -> hash` membuat perubahan
 * atau penghapusan baris lama dapat dideteksi oleh `php artisan audit:verify`.
 */
class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event',
        'subject_type',
        'subject_id',
        'actor_id',
        'actor_role',
        'changes',
        'ip_address',
        'user_agent',
        'previous_hash',
        'hash',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
