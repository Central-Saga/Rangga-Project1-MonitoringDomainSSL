<?php

namespace Tests\Feature;

use App\Enums\AssetStatus;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

/**
 * Audit 6.4: use case multi-tulis harus berada di dalam transaksi.
 *
 * Setiap test menggagalkan query tulis kedua lalu memastikan tulisan pertama
 * ikut dibatalkan (rollback), bukan hanya terverifikasi secara statis.
 */
class TransactionalServiceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_failed_token_creation_rolls_back_registered_user(): void
    {
        $this->withoutExceptionHandling();
        $this->failOnSqlContaining('insert into "personal_access_tokens"');

        try {
            $this->postJson('/api/auth/register', [
                'name' => 'Rollback User',
                'email' => 'rollback@example.com',
                'password' => 'rahasia123',
                'password_confirmation' => 'rahasia123',
            ]);
            $this->fail('Registrasi seharusnya gagal saat pembuatan token digagalkan.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('forced database failure', $exception->getMessage());
        }

        $this->assertSame(0, User::query()->count());
        $this->assertSame(0, DB::table('personal_access_tokens')->count());
    }

    public function test_failed_token_rotation_rolls_back_deleted_old_token(): void
    {
        $this->withoutExceptionHandling();
        $user = User::factory()->admin()->create(['email' => 'admin@example.com']);
        $user->createToken('old');
        $oldTokenId = $user->tokens()->firstOrFail()->id;
        $this->failOnSqlContaining('insert into "personal_access_tokens"');

        try {
            $this->postJson('/api/auth/login', [
                'email' => 'admin@example.com',
                'password' => 'password',
            ]);
            $this->fail('Login seharusnya gagal saat pembuatan token baru digagalkan.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('forced database failure', $exception->getMessage());
        }

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $oldTokenId]);
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_failed_token_revocation_rolls_back_password_change(): void
    {
        $this->withoutExceptionHandling();
        $user = User::factory()->admin()->create([
            'password' => Hash::make('rahasia123'),
        ]);
        $originalHash = $user->password;
        $oldToken = $user->createToken('old')->plainTextToken;
        $this->failOnSqlContaining('delete from "personal_access_tokens"');

        try {
            $this->withHeader('Authorization', "Bearer {$oldToken}")
                ->postJson('/api/auth/change-password', [
                    'current_password' => 'rahasia123',
                    'password' => 'rahasia456',
                    'password_confirmation' => 'rahasia456',
                ]);
            $this->fail('Ganti password seharusnya gagal saat pencabutan token digagalkan.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('forced database failure', $exception->getMessage());
        }

        $this->assertSame($originalHash, $user->fresh()->password);
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_failed_notification_rolls_back_expired_status(): void
    {
        $this->withoutExceptionHandling();
        $this->travelTo(Carbon::parse('2026-10-07 09:00:00'));
        User::factory()->admin()->create();
        $asset = Asset::factory()->create([
            'status' => AssetStatus::Active,
            'expired_date' => now()->subDay(),
        ]);
        $this->failOnSqlContaining('insert into "notifications"');

        try {
            $this->artisan('assets:check-expiry');
            $this->fail('Pengecekan seharusnya gagal saat notifikasi digagalkan.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('forced database failure', $exception->getMessage());
        }

        $this->assertSame(AssetStatus::Active, $asset->fresh()->status);
        $this->assertSame(0, DatabaseNotification::query()->count());
    }

    private function failOnSqlContaining(string $needle): void
    {
        DB::listen(function (QueryExecuted $query) use ($needle): void {
            if (str_contains(strtolower($query->sql), strtolower($needle))) {
                throw new RuntimeException("forced database failure: {$needle}");
            }
        });
    }
}
