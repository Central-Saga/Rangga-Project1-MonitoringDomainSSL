<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('event', 32);
            $table->string('subject_type');
            $table->string('subject_id');
            $table->foreignId('actor_id')->nullable();
            $table->string('actor_role', 32)->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->char('previous_hash', 64);
            $table->char('hash', 64);
            $table->timestamp('created_at');

            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
            $table->index('actor_id');
        });

        // Singlet state untuk mendeteksi penghapusan baris terakhir: rantai
        // saja tidak punya "baris berikutnya" untuk membandingkan head hash.
        Schema::create('audit_log_state', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->char('head_hash', 64);
            $table->unsignedBigInteger('entry_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log_state');
        Schema::dropIfExists('audit_logs');
    }
};
