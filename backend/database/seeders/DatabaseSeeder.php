<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Refuse to seed demo accounts against production. They use a fixed
        // well-known password and exist purely for local dev convenience.
        if (app()->environment('production')) {
            $this->command?->warn('Skipping DatabaseSeeder in production — it would create demo accounts with a public password.');
            return;
        }

        $this->call(StaySyncSeeder::class);

        // Allow the operator to override the demo password for non-prod
        // environments where the default "password" is undesirable (e.g.
        // a shared staging server). Falls back to "password" for local dev.
        $demoPassword = env('SEED_DEMO_PASSWORD', 'password');

        $users = [
            [
                'name'  => 'StaySync Admin',
                'email' => 'admin@staysync.test',
                'role'  => 'admin',
            ],
            [
                'name'  => 'StaySync Manager',
                'email' => 'manager@staysync.test',
                'role'  => 'manager',
            ],
            [
                'name'  => 'StaySync Receptionist',
                'email' => 'receptionist@staysync.test',
                'role'  => 'receptionist',
            ],
            [
                'name'  => 'StaySync Housekeeper',
                'email' => 'housekeeper@staysync.test',
                'role'  => 'housekeeper',
            ],
        ];

        foreach ($users as $row) {
            User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name'              => $row['name'],
                    'password'          => Hash::make($demoPassword),
                    'role'              => $row['role'],
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
