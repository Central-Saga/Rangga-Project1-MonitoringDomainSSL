<?php

namespace App\Providers;

use App\Services\RenewalService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Binding service use case agar controller menerima instance via DI.
        $this->app->bind(RenewalService::class, fn (): RenewalService => new RenewalService);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Audit 2.9 / 6.x: strict mode hanya di luar production.
        if (! $this->app->environment('production')) {
            Model::preventLazyLoading();
            Model::preventSilentlyDiscardingAttributes();
        }
    }
}
