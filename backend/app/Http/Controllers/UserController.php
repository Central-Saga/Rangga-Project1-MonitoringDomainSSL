<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ConstrainsListQueries;
use App\Http\Concerns\CreatedResponse;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
    use ConstrainsListQueries;
    use CreatedResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);
        $this->validateListQuery($request, ['created_at', 'name', 'email'], ['role', 'search']);

        $users = User::query()
            ->select(['id', 'name', 'email', 'email_verified_at', 'role', 'client_id', 'created_at', 'updated_at'])
            ->with('client')
            ->when($request->string('role')->trim()->isNotEmpty(), function ($query) use ($request): void {
                $query->where('role', $request->string('role')->trim()->value());
            })
            ->when($request->string('search')->trim()->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('search')->trim()->value();
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($this->perPage($request))
            ->withQueryString();

        return UserResource::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return $this->created(new UserResource($user->load('client')), 'users.show', $user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user->load('client'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return new UserResource($user->load('client'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, User $user): Response
    {
        $this->authorize('delete', $user);

        abort_if($request->user()->is($user), 422, 'Tidak bisa menghapus akun sendiri.');

        $user->delete();

        return response()->noContent();
    }
}
