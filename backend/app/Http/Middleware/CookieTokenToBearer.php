<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CookieTokenToBearer
{
    /**
     * Terjemahkan cookie token HttpOnly menjadi header Bearer agar Sanctum
     * tetap bisa mengautentikasi tanpa menyimpan token di JavaScript.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->hasHeader('Authorization')) {
            $token = $request->cookies->get('token');

            if (is_string($token) && $token !== '') {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }
}
