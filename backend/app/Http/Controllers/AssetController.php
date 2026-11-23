<?php

namespace App\Http\Controllers;

use App\Enums\AssetStatus;
use App\Http\Concerns\ConstrainsListQueries;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AssetController extends Controller
{
    use ConstrainsListQueries;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Asset::class);
        $this->validateListQuery($request, ['expired_date', 'created_at', 'name'], ['type', 'status', 'project_id', 'expiring_in', 'search']);

        $assets = Asset::query()
            ->with('project.client')
            ->when($request->user()->isClient(), function (Builder $query) use ($request): void {
                $query->whereHas('project', fn (Builder $query) => $query->where('client_id', $request->user()->client_id));
            })
            ->when($request->string('type')->trim()->isNotEmpty(), function (Builder $query) use ($request): void {
                $query->where('type', $request->string('type')->trim()->value());
            })
            ->when($request->string('status')->trim()->isNotEmpty(), function (Builder $query) use ($request): void {
                $query->where('status', $request->string('status')->trim()->value());
            })
            ->when($request->integer('project_id'), function (Builder $query, int $projectId): void {
                $query->where('project_id', $projectId);
            })
            ->when($request->integer('expiring_in'), function (Builder $query, int $days): void {
                $query->where('status', AssetStatus::Active->value)
                    ->whereDate('expired_date', '>=', now()->toDateString())
                    ->whereDate('expired_date', '<=', now()->addDays($days)->toDateString());
            })
            ->when($request->string('search')->trim()->isNotEmpty(), function (Builder $query) use ($request): void {
                $search = $request->string('search')->trim()->value();
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'ilike', "%{$search}%")
                        ->orWhere('provider', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('expired_date')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AssetResource::collection($assets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssetRequest $request): AssetResource
    {
        $this->authorize('create', Asset::class);

        $asset = Asset::query()->create($request->validated());

        $resource = new AssetResource($asset->load('project.client'));

        return response($resource, 201)
            ->header('Location', route('assets.show', $asset->id));
    }

    /**
     * Display the specified resource.
     */
    public function show(Asset $asset): AssetResource
    {
        $this->authorize('view', $asset);

        return new AssetResource($asset->load([
            'project.client',
            'renewals' => fn ($query) => $query->with('renewedBy')->latest('renewal_date'),
        ]));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssetRequest $request, Asset $asset): AssetResource
    {
        $this->authorize('update', $asset);

        $asset->update($request->validated());

        return new AssetResource($asset->load('project.client'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Asset $asset): Response
    {
        $this->authorize('delete', $asset);

        $asset->delete();

        return response()->noContent();
    }
}
