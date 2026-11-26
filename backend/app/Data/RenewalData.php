<?php

namespace App\Data;

/**
 * DTO untuk use case pencatatan perpanjangan (audit #94).
 */
final readonly class RenewalData
{
    public function __construct(
        public string $newExpiredDate,
        public ?string $renewalDate = null,
        public int|float|string|null $cost = null,
        public ?string $invoiceNumber = null,
        public ?string $paymentMethod = null,
        public ?string $status = null,
        public ?string $notes = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function from(array $data): self
    {
        return new self(
            newExpiredDate: (string) ($data['new_expired_date'] ?? ''),
            renewalDate: isset($data['renewal_date']) ? (string) $data['renewal_date'] : null,
            cost: $data['cost'] ?? null,
            invoiceNumber: isset($data['invoice_number']) ? (string) $data['invoice_number'] : null,
            paymentMethod: isset($data['payment_method']) ? (string) $data['payment_method'] : null,
            status: isset($data['status']) ? (string) $data['status'] : null,
            notes: isset($data['notes']) ? (string) $data['notes'] : null,
        );
    }
}
