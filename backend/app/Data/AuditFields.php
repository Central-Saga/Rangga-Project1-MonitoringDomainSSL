<?php

namespace App\Data;

/**
 * Field audit log yang di-hash untuk rantai tamper-evident (audit #94).
 *
 * Urutan kunci harus dipertahankan supaya hash entri lama tetap terverifikasi.
 */
final readonly class AuditFields
{
    /**
     * @param  array<string, mixed>  $values
     */
    public function __construct(public array $values = []) {}

    /**
     * @param  array<string, mixed>  $values
     */
    public static function from(array $values): self
    {
        return new self($values);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->values;
    }

    public function fingerprint(): string
    {
        return hash('sha256', json_encode(
            $this->values,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        ));
    }
}
