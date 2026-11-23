<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Unique index yang kompatibel dengan SoftDeletes.
     *
     * Baris yang sudah di-soft-delete (deleted_at != null) tidak ikut
     * dalam constraint, sehingga data lama bisa tetap disimpan tanpa
     * tabrakan saat entitas baru dengan nama/email sama dibuat.
     */
    public function up(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX clients_email_active_unique ON clients (email) '
            .'WHERE deleted_at IS NULL AND email IS NOT NULL'
        );

        DB::statement(
            'CREATE UNIQUE INDEX projects_client_name_active_unique ON projects (client_id, name) '
            .'WHERE deleted_at IS NULL'
        );

        DB::statement(
            'CREATE UNIQUE INDEX assets_project_name_active_unique ON assets (project_id, name) '
            .'WHERE deleted_at IS NULL'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS assets_project_name_active_unique');
        DB::statement('DROP INDEX IF EXISTS projects_client_name_active_unique');
        DB::statement('DROP INDEX IF EXISTS clients_email_active_unique');
    }
};
