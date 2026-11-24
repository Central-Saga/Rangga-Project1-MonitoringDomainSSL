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

/**
 * Nama resource untuk apiResource mengikuti prefix versi agar tidak tabrakan
 * antara route legacy (/api) dan route berversi (/api/v1) -- audit 3.7.
 *
 * @return array<string, string>
 */
$resourceNames = static function (string $resource, string $prefix): array {
    $names = [];

    foreach (['index', 'store', 'show', 'update', 'destroy'] as $action) {
        $names[$action] = $prefix.$resource.'.'.$action;
    }

    return $names;
};

/**
 * Satu definisi route dipakai dua kali: /api (kompatibilitas) dan /api/v1
 * (kanonik berversi). Parameter id dibatasi angka -- audit 3.5.
 */
$registerRoutes = static function (string $prefix) use ($resourceNames): void {
    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1')
        ->name($prefix.'auth.register');

    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name($prefix.'auth.login');

    // Urutan middleware: auth -> throttle -> bindings (binding dipindah dari grup api).
    Route::middleware(['auth:sanctum', 'throttle:60,1', SubstituteBindings::class])->group(function () use ($prefix, $resourceNames): void {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name($prefix.'auth.logout');
        Route::post('/auth/change-password', [AuthController::class, 'changePassword'])
            ->middleware('throttle:5,1')
            ->name($prefix.'auth.change-password');
        Route::get('/auth/me', [AuthController::class, 'me'])->name($prefix.'auth.me');

        Route::get('/dashboard/summary', DashboardController::class)->name($prefix.'dashboard.summary');

        Route::apiResource('clients', ClientController::class)
            ->names($resourceNames('clients', $prefix))
            ->where(['client' => '[0-9]+']);
        Route::apiResource('projects', ProjectController::class)
            ->names($resourceNames('projects', $prefix))
            ->where(['project' => '[0-9]+']);
        Route::apiResource('assets', AssetController::class)
            ->names($resourceNames('assets', $prefix))
            ->where(['asset' => '[0-9]+']);

        // scopeBindings(): child renewal harus milik asset induk yang diminta.
        Route::scopeBindings()->group(function () use ($prefix): void {
            Route::get('/assets/{asset}/renewals', [RenewalController::class, 'index'])
                ->whereNumber('asset')
                ->name($prefix.'assets.renewals.index');
            Route::post('/assets/{asset}/renewals', [RenewalController::class, 'store'])
                ->whereNumber('asset')
                ->name($prefix.'assets.renewals.store');
        });
        Route::apiResource('renewals', RenewalController::class)
            ->only(['show', 'update', 'destroy'])
            ->names($resourceNames('renewals', $prefix))
            ->where(['renewal' => '[0-9]+']);

        Route::get('/notifications', [NotificationController::class, 'index'])->name($prefix.'notifications.index');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name($prefix.'notifications.read-all');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
            ->whereNumber('id')
            ->name($prefix.'notifications.read');

        Route::get('/reports/expiring-assets/pdf', [ReportController::class, 'expiringAssets'])->name($prefix.'reports.expiring-assets');
        Route::get('/renewals/{renewal}/invoice/pdf', [ReportController::class, 'renewalInvoice'])
            ->whereNumber('renewal')
            ->name($prefix.'renewals.invoice');

        Route::apiResource('users', UserController::class)
            ->names($resourceNames('users', $prefix))
            ->where(['user' => '[0-9]+']);
    });
};

// Legacy: tetap aktif agar klien lama tidak putus (route names tanpa prefix).
$registerRoutes('');

// Kanonik berversi: /api/v1/... dengan nama diawali "v1.".
Route::prefix('v1')->group(fn () => $registerRoutes('v1.'));
