<?php

namespace App\Http\Requests;

use App\Enums\AssetStatus;
use App\Enums\AssetType;
use App\Enums\BillingCycle;
use App\Http\Concerns\ScopedExists;
use App\Models\Asset;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAssetRequest extends FormRequest
{
    use ScopedExists;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Asset::class);
    }

    /**
     * Normalisasi input sebelum validasi (audit 4.9).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge(['name' => trim((string) $this->input('name'))]);
        }

        if ($this->has('provider')) {
            $this->merge(['provider' => trim((string) $this->input('provider'))]);
        }
    }

    /**
     * Aturan bisnis lintas field (audit 4.10).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $start = $this->input('start_date');
            $expired = $this->input('expired_date');

            if (! is_string($start) || ! is_string($expired)) {
                return;
            }

            $startTs = strtotime($start);
            $expiredTs = strtotime($expired);

            if ($startTs !== false && $expiredTs !== false && $expiredTs < $startTs) {
                $validator->errors()->add('expired_date', 'Tanggal kedaluwarsa harus setelah tanggal mulai.');
            }
        });
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', $this->projectExistsRule()],
            'type' => ['required', Rule::enum(AssetType::class)],
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['nullable', 'string', 'max:255'],
            'renewal_cost' => ['sometimes', 'numeric', 'min:0'],
            'billing_cycle' => ['sometimes', Rule::enum(BillingCycle::class)],
            'start_date' => ['nullable', 'date'],
            'expired_date' => ['required', 'date'],
            'auto_renew' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::enum(AssetStatus::class)],
            'metadata' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
