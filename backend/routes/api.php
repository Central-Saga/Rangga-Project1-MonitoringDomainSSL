<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RenewalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1')
    ->name('auth.register');

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1')
    ->name('auth.login');

// Urutan middleware: auth -> throttle -> bindings (binding dipindah dari grup api).
Route::middleware(['auth:sanctum', 'throttle:60,1', SubstituteBindings::class])->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])
        ->middleware('throttle:5,1')
        ->name('auth.change-password');
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');

    Route::get('/dashboard/summary', DashboardController::class)->name('dashboard.summary');

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('assets', AssetController::class);

    // scopeBindings(): child renewal harus milik asset induk yang diminta.
    Route::scopeBindings()->group(function (): void {
        Route::get('/assets/{asset}/renewals', [RenewalController::class, 'index'])->name('assets.renewals.index');
        Route::post('/assets/{asset}/renewals', [RenewalController::class, 'store'])->name('assets.renewals.store');
    });
    Route::apiResource('renewals', RenewalController::class)->only(['show', 'update', 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    Route::get('/reports/expiring-assets/pdf', [ReportController::class, 'expiringAssets'])->name('reports.expiring-assets');
    Route::get('/renewals/{renewal}/invoice/pdf', [ReportController::class, 'renewalInvoice'])->name('renewals.invoice');

    Route::apiResource('users', UserController::class);
});
