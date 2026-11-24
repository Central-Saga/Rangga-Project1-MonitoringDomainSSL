<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ConstrainsListQueries;
use App\Http\Concerns\CreatedResponse;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProjectController extends Controller
{
    use ConstrainsListQueries;
    use CreatedResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Project::class);
        $this->validateListQuery($request, ['created_at', 'name', 'start_date', 'end_date'], ['client_id', 'status', 'search']);

        $projects = Project::query()
            ->select(['id', 'client_id', 'name', 'description', 'status', 'start_date', 'end_date', 'created_at', 'updated_at'])
            ->with('client')
            ->withCount('assets')
            ->when($request->user()->isClient(), function (Builder $query) use ($request): void {
                $query->where('client_id', $request->user()->client_id);
            })
            ->when($request->integer('client_id'), function (Builder $query, int $clientId): void {
                $query->where('client_id', $clientId);
            })
            ->when($request->string('status')->trim()->isNotEmpty(), function (Builder $query) use ($request): void {
                $query->where('status', $request->string('status')->trim()->value());
            })
            ->when($request->string('search')->trim()->isNotEmpty(), function (Builder $query) use ($request): void {
                $query->where('name', 'ilike', '%'.$request->string('search')->trim()->value().'%');
            })
            ->latest()
            ->paginate($this->perPage($request))
            ->withQueryString();

        return ProjectResource::collection($projects);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = Project::query()->create($request->validated());

        return $this->created(new ProjectResource($project->load('client')), 'projects.show', $project);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): ProjectResource
    {
        $this->authorize('view', $project);

        return new ProjectResource($project->load(['client', 'assets' => fn ($query) => $query->orderBy('expired_date')]));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $project->update($request->validated());

        return new ProjectResource($project->load('client'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): Response
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->noContent();
    }
}
