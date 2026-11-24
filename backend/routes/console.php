<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('assets:check-expiry')->dailyAt('07:00')->withoutOverlapping();

// Bersihkan token Sanctum yang sudah kedaluwarsa (audit 10.3).
Schedule::command('sanctum:prune-expired --hours=24')->dailyAt('03:00')->withoutOverlapping();

// Job gagal dipertahankan 48 jam untuk diagnosis, lalu dipangkas otomatis
// agar tabel failed_jobs tidak tumbuh tanpa batas (audit #113 / 9.9).
Schedule::command('queue:prune-failed --hours=48')->dailyAt('03:30')->withoutOverlapping();
