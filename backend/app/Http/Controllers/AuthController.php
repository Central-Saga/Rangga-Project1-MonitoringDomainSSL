<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrasi user baru (role client) dan terbitkan token Sanctum lewat cookie.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            ...$request->validated(),
            'role' => UserRole::Client,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return $this->withAuthCookies(
            response()->json([
                'user' => new UserResource($user->load('client')),
            ], 201),
            $token
        );
    }

    /**
     * Login dan terbitkan token Sanctum lewat cookie HttpOnly.
     *
     * @throws ValidationException
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return $this->withAuthCookies(
            response()->json([
                'user' => new UserResource($user->load('client')),
            ]),
            $token
        );
    }

    /**
     * Logout: cabut token dan hapus cookie auth/CSRF.
     */
    public function logout(Request $request): JsonResponse
    {
        // Cabut seluruh token milik user agar token lama tidak bisa dipakai ulang.
        $request->user()->tokens()->delete();

        return response()
            ->json(['message' => 'Berhasil logout.'])
            ->withCookie(Cookie::forget('token'))
            ->withCookie(Cookie::forget('XSRF-TOKEN'));
    }

    /**
     * Ganti password dan cabut seluruh token (akses lama langsung mati).
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['password' => $request->validated('password')]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password berhasil diubah. Silakan login kembali.']);
    }

    /**
     * Profil user yang sedang login.
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('client'));
    }

    /**
     * Token_auth tidak pernah dikirim dalam body JSON / JavaScript.
     */
    private function withAuthCookies(JsonResponse $response, string $token): JsonResponse
    {
        $secure = app()->environment('production');

        return $response
            ->cookie('token', $token, 60, '/', null, $secure, true, false, 'lax')
            ->cookie('XSRF-TOKEN', Str::random(40), 60, '/', null, $secure, false, false, 'lax');
    }
}
