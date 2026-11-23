<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ConstrainsListQueries;
use App\Http\Requests\StoreRenewalRequest;
use App\Http\Requests\UpdateRenewalRequest;
use App\Http\Resources\RenewalResource;
use App\Models\Asset;
use App\Models\Renewal;
use App\Services\RenewalService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RenewalController extends Controller
{
    use ConstrainsListQueries;

    /**
     * Riwayat perpanjangan milik satu aset.
     */
    public function index(Asset $asset): AnonymousResourceCollection
    {
        $this->authorize('view', $asset);

        $renewals = $asset->renewals()
            ->with('renewedBy')
            ->latest('renewal_date')
            ->get();

        return RenewalResource::collection($renewals);
    }

    /**
     * Catat perpanjangan baru sekaligus perbarui masa aktif aset.
     */
    public function store(StoreRenewalRequest $request, Asset $asset, RenewalService $service): RenewalResource
    {
        $this->authorize('update', $asset);

        $renewal = $service->record($asset, $request->validated(), $request->user());

        return new RenewalResource($renewal->load(['renewedBy', 'asset']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Renewal $renewal): RenewalResource
    {
        $this->authorize('view', $renewal);

        return new RenewalResource($renewal->load(['renewedBy', 'asset.project.client']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRenewalRequest $request, Renewal $renewal): RenewalResource
    {
        $this->authorize('update', $renewal);

        $renewal->update($request->validated());

        return new RenewalResource($renewal->load(['renewedBy', 'asset']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Renewal $renewal): Response
    {
        $this->authorize('delete', $renewal);

        $renewal->delete();

        return response()->noContent();
    }
}
