<?php

namespace Tests\Feature;

use Dotenv\Dotenv;
use Tests\TestCase;

/**
 * Prasyarat audit #92 dan eksekusi bersih #97.
 *
 * Test ini membuktikan bahwa artefak dokumentasi yang dijanjikan README benar-
 * benar ada, saling konsisten, dan merujuk ke file/perintah yang tersedia.
 * Ini adalah verifikasi statis: boot Docker + pengukuran waktu nyata tetap
 * dilakukan manual oleh auditor mengikuti langkah README.
 */
class DocumentationReadinessTest extends TestCase
{
    /**
     * @return list<string>
     */
    private function requiredFiles(): array
    {
        return [
            'docs/AUDIT.md',
            'docs/PRD.md',
            'docs/AUDIT-EVIDENCE.md',
            'audit.yml',
            'README.md',
            '.env.example',
            'backend/.env.example',
            'PRD.md',
            'compose.yaml',
        ];
    }

    private function path(string $relative): string
    {
        return dirname(__DIR__, 3).'/'.$relative;
    }

    private function contents(string $relative): string
    {
        $absolute = $this->path($relative);
        $this->assertFileExists($absolute, "Berkas {$relative} harus ada di root repo.");

        return (string) file_get_contents($absolute);
    }

    public function test_audit_prerequisite_files_are_present(): void
    {
        foreach ($this->requiredFiles() as $relative) {
            $this->assertFileExists($this->path($relative), "Prasyarat audit {$relative} tidak ditemukan.");
        }
    }

    public function test_audit_guide_lists_one_seed_account_per_role(): void
    {
        $guide = $this->contents('docs/AUDIT.md');

        foreach (['admin', 'staff', 'client'] as $role) {
            $this->assertStringContainsString($role.'@example.com', $guide);
        }

        $this->assertStringContainsString('SEED_PASSWORD', $guide);
        $this->assertStringContainsString('password', $guide);
        $this->assertStringContainsString('POST /api/auth/login', $guide);
        $this->assertStringContainsString('GET /up', $guide);
    }

    public function test_prd_files_declare_numbered_acceptance_criteria(): void
    {
        foreach (['docs/PRD.md', 'PRD.md'] as $file) {
            $prd = $this->contents($file);

            for ($number = 1; $number <= 9; $number++) {
                $this->assertStringContainsString(sprintf('AC-%02d', $number), $prd, "{$file} harus memuat AC-".sprintf('%02d', $number));
            }
        }
    }

    public function test_manifest_declares_stacks_accounts_and_docs(): void
    {
        $manifest = $this->contents('audit.yml');

        foreach ([
            'path: backend',
            'path: frontend',
            'framework: laravel',
            'framework: next.js',
            'seed_accounts:',
            'SEED_PASSWORD',
            'admin@example.com',
            'staff@example.com',
            'client@example.com',
            'docs/AUDIT.md',
            'docs/PRD.md',
            'compose.yaml',
            'AC-09',
        ] as $needle) {
            $this->assertStringContainsString($needle, $manifest, "audit.yml harus memuat '{$needle}'.");
        }
    }

    public function test_seed_password_is_declared_in_env_examples(): void
    {
        foreach (['.env.example', 'backend/.env.example'] as $file) {
            $this->assertStringContainsString('SEED_PASSWORD=password', $this->contents($file), "{$file} harus mendeklarasikan SEED_PASSWORD.");
        }
    }

    public function test_env_examples_are_parseable_by_dotenv(): void
    {
        foreach (['.env.example', 'backend/.env.example'] as $file) {
            $directory = sys_get_temp_dir().'/audit-env-'.bin2hex(random_bytes(6));
            mkdir($directory);

            try {
                copy($this->path($file), $directory.'/.env');
                $variables = Dotenv::createArrayBacked($directory)->load();
                $this->assertIsArray($variables, "{$file} harus bisa diparse dotenv.");

                if ($file === 'backend/.env.example') {
                    // Backslash pada namespace harus dieskap; kalau tidak, dotenv menolak
                    // file .env dan seluruh artisan command gagal saat boot.
                    $this->assertSame('App\\Models\\User', $variables['AUTH_MODEL'] ?? null);
                }
            } finally {
                if (file_exists($directory.'/.env')) {
                    unlink($directory.'/.env');
                }
                rmdir($directory);
            }
        }
    }

    public function test_env_example_defaults_work_with_postgres_and_phpredis(): void
    {
        $env = $this->contents('backend/.env.example');

        // Nilai MySQL-only dan nilai khusus predis membuat migrate/queue:restart
        // gagal pada rehearsal rilis #112; keduanya sudah diperbaiki.
        $this->assertStringContainsString('DB_CONNECTION=pgsql', $env);
        $this->assertStringContainsString('DB_CHARSET=utf8', $env);
        $this->assertStringNotContainsString('DB_CHARSET=utf8mb4', $env);
        $this->assertStringContainsString('REDIS_CLIENT=phpredis', $env);
        $this->assertStringContainsString('REDIS_BACKOFF_ALGORITHM=equal_jitter', $env);
        $this->assertStringNotContainsString('REDIS_BACKOFF_ALGORITHM=decorrelatedJitterBackoffV2', $env);
    }

    public function test_readme_documents_clean_execution_under_fifteen_minutes(): void
    {
        $readme = $this->contents('README.md');

        foreach ([
            '15 menit',
            'git clone',
            'cp backend/.env.example backend/.env',
            'docker compose -f compose.yaml up -d --build',
            'docker compose -f compose.yaml ps',
            'curl -fsS http://localhost:8000/up',
            'admin@example.com',
            'SEED_PASSWORD',
            'composer install',
            'npm ci',
            'php artisan test',
            'npm test',
        ] as $needle) {
            $this->assertStringContainsString($needle, $readme, "README harus memuat '{$needle}'.");
        }
    }

    public function test_documented_quickstart_references_existing_files_and_scripts(): void
    {
        foreach ([
            'backend/artisan',
            'backend/Dockerfile',
            'backend/.env.compose',
            'backend/composer.json',
            'backend/docker/entrypoint.d/99-app-init.sh',
            'frontend/Dockerfile',
            'frontend/package.json',
            'frontend/package-lock.json',
        ] as $file) {
            $this->assertFileExists($this->path($file), "README merujuk ke {$file} yang tidak ada.");
        }

        $package = $this->contents('frontend/package.json');
        foreach (['"dev"', '"build"', '"test"', '"lint"', '"check:bundle"'] as $script) {
            $this->assertStringContainsString($script, $package, "frontend/package.json harus memuat script {$script}.");
        }

        $compose = $this->contents('compose.yaml');
        foreach (['db', 'redis', 'mailpit', 'backend', 'queue', 'scheduler', 'frontend'] as $service) {
            $this->assertMatchesRegularExpression('/^  '.preg_quote($service, '/').':/m', $compose, "compose.yaml harus mendeklarasikan service {$service}.");
        }
        $this->assertStringContainsString('healthcheck:', $compose);
    }
}
