<?php

namespace App\Http\Concerns;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Pembatasan query list API: per_page di-cap dan sort/filter di-whitelist.
 */
trait ConstrainsListQueries
{
    /**
     * Ambil per_page yang sudah dibatasi (1..max).
     */
    protected function perPage(Request $request, int $max = 50): int
    {
        $value = $request->query('per_page');

        if ($value !== null && ! is_numeric($value)) {
            throw ValidationException::withMessages([
                'per_page' => ['per_page harus berupa angka.'],
            ]);
        }

        return min(max((int) ($value ?: 15), 1), $max);
    }

    /**
     * Tolak sort/filter yang tidak termasuk whitelist.
     *
     * @param  list<string>  $allowedSorts
     * @param  list<string>  $allowedFilters
     */
    protected function validateListQuery(Request $request, array $allowedSorts, array $allowedFilters = []): void
    {
        $sort = $request->query('sort');

        if ($sort !== null && ! in_array($sort, $allowedSorts, true)) {
            throw ValidationException::withMessages([
                'sort' => ['Kolom sort tidak diizinkan.'],
            ]);
        }

        $filters = $request->query('filter', []);

        if (! is_array($filters)) {
            throw ValidationException::withMessages([
                'filter' => ['format filter tidak valid.'],
            ]);
        }

        foreach (array_keys($filters) as $key) {
            if (! in_array($key, $allowedFilters, true)) {
                throw ValidationException::withMessages([
                    "filter.{$key}" => ['Filter tidak diizinkan.'],
                ]);
            }
        }
    }
}
