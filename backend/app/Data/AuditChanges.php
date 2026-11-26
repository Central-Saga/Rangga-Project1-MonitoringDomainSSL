<?php

namespace App\Data;

/**
 * Kumpulan perubahan yang akan ditulis ke audit log (audit #94).
 *
 * Sanitasi data sensitif dipindahkan ke value object agar service audit tidak
 * menerima array mentah dan aturan yang sama dipakai saat verifikasi rantai.
 */
final readonly class AuditChanges
{
    private const SENSITIVE = ['password', 'remember_token', 'token', 'x-xsrf-token', 'xsrf-token'];

    /**
     * @param  array<string, mixed>  $values
     */
    public function __construct(public array $values = []) {}

    public function sanitized(): self
    {
        return new self(self::sanitize($this->values));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->values;
    }

    /**
     * @param  array<mixed>  $values
     * @return array<mixed>
     */
    private static function sanitize(array $values): array
    {
        $clean = [];

        foreach ($values as $key => $value) {
            if (in_array(strtolower((string) $key), self::SENSITIVE, true)) {
                continue;
            }

            $clean[$key] = is_array($value) ? self::sanitize($value) : $value;
        }

        ksort($clean);

        return $clean;
    }
}
