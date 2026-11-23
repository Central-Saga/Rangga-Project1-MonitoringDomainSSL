<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menautkan satu id ke setiap request API untuk korelasi log (audit 12.3).
 *
 * - Klien boleh mengirim X-Request-ID sendiri (dibatasi format/panjangnya).
 * - Jika tidak ada, id baru dibuat.
 * - Id dikirim balik lewat header response dan dimasukkan ke context log.
 */
class AssignRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $incoming = $request->headers->get('X-Request-ID');

        $requestId = is_string($incoming) && preg_match('/^[A-Za-z0-9._:-]{1,64}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid();

        $request->headers->set('X-Request-ID', $requestId);

        Log::withContext([
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
        ]);

        $response = $next($request);
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
