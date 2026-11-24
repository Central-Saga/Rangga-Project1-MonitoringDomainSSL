<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    #[DataProvider('endpointProvider')]
    public function test_every_response_has_baseline_security_headers(string $path): void
    {
        $response = $this->getJson($path);

        foreach ([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'no-referrer',
            'X-Powered-By' => null,
        ] as $header => $expected) {
            if ($expected === null) {
                $response->assertHeaderMissing($header);

                continue;
            }

            $response->assertHeader($header, $expected);
        }

        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertNotNull($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringNotContainsString('unsafe-inline', $csp);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function endpointProvider(): array
    {
        return [
            'health' => ['/up'],
            'not found' => ['/api/route-yang-tidak-ada'],
            'validation error' => ['/api/auth/login'],
        ];
    }
}
