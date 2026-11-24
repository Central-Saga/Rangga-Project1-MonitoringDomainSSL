<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    /**
     * Daftar proxy tepercaya. Default '*' untuk deployment di balik
     * load balancer; prod sebaiknya mengisi TRUSTED_PROXIES (comma separated).
     *
     * @var array<int, string>|string|null
     */
    protected $proxies;

    /**
     * Header forwarding yang dipercaya.
     *
     * @var int
     */
    protected $headers =
        Request::HEADER_X_FORWARDED_FOR
        | Request::HEADER_X_FORWARDED_HOST
        | Request::HEADER_X_FORWARDED_PORT
        | Request::HEADER_X_FORWARDED_PROTO;

    public function __construct()
    {
        $configured = config('app.trusted_proxies', '*');

        $this->proxies = $configured === '*'
            ? '*'
            : array_values(array_filter(array_map('trim', explode(',', (string) $configured))));
    }
}
