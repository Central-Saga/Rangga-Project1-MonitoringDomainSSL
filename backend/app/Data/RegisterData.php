<?php

namespace App\Data;

/**
 * DTO untuk use case registrasi (audit #94).
 *
 * Request tervalidasi dikonversi ke objek ini di batas controller, sehingga
 * service tidak menerima array mentah dan kontrak fieldnya eksplisit.
 */
final readonly class RegisterData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function from(array $data): self
    {
        return new self(
            name: (string) ($data['name'] ?? ''),
            email: (string) ($data['email'] ?? ''),
            password: (string) ($data['password'] ?? ''),
        );
    }

    /**
     * @return array{name: string, email: string, password: string}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'password' => $this->password,
        ];
    }
}
