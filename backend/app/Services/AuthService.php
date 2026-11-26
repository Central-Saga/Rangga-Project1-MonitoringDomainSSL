<?php

namespace App\Services;

use App\Data\LoginCredentials;
use App\Data\RegisterData;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Use case autentikasi yang menulis lebih dari satu tabel.
 *
 * User + token, rotasi token saat login, dan perubahan password + pencabutan
 * token harus berhasil seluruhnya atau dibatalkan seluruhnya.
 */
class AuthService
{
    /**
     * @return array{user: User, token: string}
     */
    public function register(RegisterData $data): array
    {
        return DB::transaction(function () use ($data): array {
            $user = User::query()->create([
                ...$data->toArray(),
                'role' => UserRole::Client,
            ]);

            return [
                'user' => $user,
                'token' => $user->createToken('api')->plainTextToken,
            ];
        });
    }

    /**
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function login(LoginCredentials $credentials): array
    {
        $user = User::query()->where('email', $credentials->email)->first();

        if (! $user || ! Hash::check($credentials->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        return DB::transaction(function () use ($user): array {
            $user->tokens()->delete();

            return [
                'user' => $user,
                'token' => $user->createToken('api')->plainTextToken,
            ];
        });
    }

    /**
     * Perbarui password dan cabut seluruh token dalam satu transaksi.
     */
    public function changePassword(User $user, string $password): void
    {
        DB::transaction(function () use ($user, $password): void {
            $user->update(['password' => $password]);
            $user->tokens()->delete();
        });
    }
}
