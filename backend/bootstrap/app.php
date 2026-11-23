<?php

use App\Http\Middleware\CookieTokenToBearer;
use App\Http\Middleware\TrustProxies;
use App\Http\Middleware\VerifyCookieCsrf;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Proxy tepercaya -> X-Forwarded-* dipakai untuk ip()/scheme()/host().
        $middleware->append(TrustProxies::class);

        // Cookie auth dan CSRF harus berjalan sebelum autentikasi Sanctum.
        $middleware->api(prepend: [
            CookieTokenToBearer::class,
            VerifyCookieCsrf::class,
        ]);

        // Binding dipindahkan ke akhir grup API agar urutannya menjadi:
        // auth -> throttle -> binding (sesuai audit 3.8).
        $middleware->api(remove: [SubstituteBindings::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
