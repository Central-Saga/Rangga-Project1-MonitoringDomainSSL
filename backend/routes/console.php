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
