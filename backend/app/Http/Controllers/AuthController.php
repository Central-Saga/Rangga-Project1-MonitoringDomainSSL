<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrasi user baru (role client) dan terbitkan token Sanctum lewat cookie.
     */
    public function register(RegisterRequest $request, AuthService $service): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $service->register($request->validated());

        return $this->withAuthCookies(
            response()->json([
                'user' => new UserResource($user->load('client')),
            ], 201)->header('Location', route('auth.me')),
            $token
        );
    }

    /**
     * Login dan terbitkan token Sanctum lewat cookie HttpOnly.
     *
     * @throws ValidationException
     */
    public function login(LoginRequest $request, AuthService $service): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $service->login($request->validated());

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
    public function changePassword(ChangePasswordRequest $request, AuthService $service): JsonResponse
    {
        $service->changePassword($request->user(), (string) $request->validated('password'));

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
