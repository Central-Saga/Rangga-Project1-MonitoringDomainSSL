<?php

namespace App\Data;

/**
 * DTO kredensial login (audit #94).
 */
final readonly class LoginCredentials
{
    public function __construct(
        public string $email,
        public string $password,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function from(array $data): self
    {
        return new self(
            email: (string) ($data['email'] ?? ''),
            password: (string) ($data['password'] ?? ''),
        );
    }
}
