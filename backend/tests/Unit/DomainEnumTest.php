<?php

namespace Tests\Unit;

use App\Enums\AssetStatus;
use App\Enums\BillingCycle;
use App\Enums\RenewalStatus;
use App\Enums\UserRole;
use PHPUnit\Framework\TestCase;

/**
 * Unit test nyata untuk perilaku enum domain (menggantikan ExampleTest.php).
 */
class DomainEnumTest extends TestCase
{
    public function test_asset_status_labels_are_stable_for_the_ui(): void
    {
        $this->assertSame('Aktif', AssetStatus::Active->label());
        $this->assertSame('Kedaluwarsa', AssetStatus::Expired->label());
        $this->assertSame('Ditangguhkan', AssetStatus::Suspended->label());
    }

    public function test_billing_cycle_months_drive_expiry_calculation(): void
    {
        $this->assertSame(1, BillingCycle::Monthly->months());
        $this->assertSame(12, BillingCycle::Yearly->months());
    }

    public function test_all_domain_enums_are_string_backed(): void
    {
        foreach ([AssetStatus::class, BillingCycle::class, RenewalStatus::class, UserRole::class] as $enum) {
            $this->assertTrue(enum_exists($enum));

            foreach ($enum::cases() as $case) {
                $this->assertIsString($case->value);
            }
        }
    }

    public function test_user_roles_match_the_authorization_matrix(): void
    {
        $this->assertSame(['admin', 'staff', 'client'], array_map(
            fn (UserRole $role): string => $role->value,
            UserRole::cases()
        ));
    }
}
