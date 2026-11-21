<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyCookieCsrf
{
    /**
     * Lindungi request state-changing yang diautentikasi lewat cookie.
     * Nilai XSRF-TOKEN sengaja bisa dibaca JavaScript, token auth tidak.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->cookies->has('token')) {
            return $next($request);
        }

        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $cookie = $request->cookie('XSRF-TOKEN');
        $header = $request->header('X-XSRF-TOKEN');

        if (! is_string($cookie) || ! is_string($header) || ! hash_equals($cookie, $header)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Token CSRF tidak valid.'], 419)
            );
        }

        return $next($request);
    }
}
