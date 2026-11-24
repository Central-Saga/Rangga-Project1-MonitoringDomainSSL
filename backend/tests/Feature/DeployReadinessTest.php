<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Kesiapan container & rilis (audit #112 / backend 15.7, 15.13).
 *
 * Temuan awal: entrypoint tidak punya storage:link, dan job release di CI
 * hanya berisi echo. Selain itu Dockerfile tidak menyertakan entrypoint.d,
 * sehingga migrasi/seed hanya berjalan di jalur Containerfile (Podman).
 */
class DeployReadinessTest extends TestCase
{
    private function contents(string $relative): string
    {
        $absolute = dirname(__DIR__, 3).'/'.$relative;
        $this->assertFileExists($absolute, "Berkas {$relative} harus ada.");

        return (string) file_get_contents($absolute);
    }

    public function test_init_script_links_storage_and_repairs_permissions(): void
    {
        $init = $this->contents('backend/docker/entrypoint.d/99-app-init.sh');

        $this->assertStringContainsString('storage:link --force', $init);
        $this->assertStringContainsString('chmod -R u+rwX', $init);
        $this->assertStringContainsString('migrate --force', $init);
    }

    public function test_dockerfile_installs_and_runs_the_init_scripts(): void
    {
        $dockerfile = $this->contents('backend/Dockerfile');

        $this->assertStringContainsString('COPY --chmod=755 docker/entrypoint.sh', $dockerfile);
        $this->assertStringContainsString('COPY --chmod=755 docker/entrypoint.d/', $dockerfile);
        $this->assertStringContainsString('ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]', $dockerfile);
    }

    public function test_entrypoint_runner_executes_init_scripts_before_service(): void
    {
        $entrypoint = $this->contents('backend/docker/entrypoint.sh');

        $this->assertStringContainsString('/etc/entrypoint.d/*.sh', $entrypoint);
        $this->assertStringContainsString('exec "$@"', $entrypoint);
    }

    public function test_containerfile_also_includes_init_scripts(): void
    {
        $this->assertStringContainsString(
            'docker/entrypoint.d/ /etc/entrypoint.d/',
            $this->contents('backend/Containerfile')
        );
    }

    public function test_release_job_runs_real_deploy_commands(): void
    {
        $ci = $this->contents('.github/workflows/ci.yml');
        $position = strpos($ci, '  release:');

        if ($position === false) {
            $this->fail('ci.yml harus memiliki job release.');
        }

        $release = substr($ci, $position);

        foreach ([
            'php artisan migrate --force',
            'php artisan storage:link --force',
            'php artisan optimize',
            'php artisan queue:restart',
            'test -L public/storage',
            'php artisan audit:verify',
        ] as $command) {
            $this->assertStringContainsString($command, $release, "Job release harus menjalankan '{$command}'.");
        }

        $this->assertStringNotContainsString('echo "Deploy hook', $release, 'Job release tidak boleh lagi hanya berisi echo.');
    }
}
