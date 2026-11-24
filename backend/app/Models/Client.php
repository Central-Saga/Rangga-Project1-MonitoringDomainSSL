<?php

namespace App\Models;

use App\Models\Concerns\RecordsAuditTrail;
use Database\Factories\ClientFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'company', 'email', 'phone', 'address'])]
class Client extends Model
{
    /** @use HasFactory<ClientFactory> */
    use HasFactory, RecordsAuditTrail, SoftDeletes;

    /**
     * Cast eksplisit untuk seluruh kolom tersimpan (termasuk audit/soft delete).
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'string',
            'company' => 'string',
            'email' => 'string',
            'phone' => 'string',
            'address' => 'string',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<Project, $this>
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Akun user ber-role client milik klien ini.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Seluruh aset infrastruktur lintas proyek milik klien ini.
     *
     * @return HasManyThrough<Asset, Project, $this>
     */
    public function assets(): HasManyThrough
    {
        return $this->hasManyThrough(Asset::class, Project::class);
    }
}
