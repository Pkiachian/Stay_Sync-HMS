<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->normalizeImportedEnumColumns();
        $this->createSqlOnlyTables();
        $this->alignUsers();
        $this->alignGuests();
        $this->alignRoomTypes();
        $this->alignRooms();
        $this->alignBookings();
        $this->alignPayments();
        $this->alignHousekeepingTasks();
        $this->alignFolioCharges();
        $this->alignSettings();
    }

    public function down(): void
    {
        //
    }

    private function normalizeImportedEnumColumns(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            DB::statement("ALTER TABLE `users` MODIFY `role` varchar(50) NOT NULL DEFAULT 'frontdesk'");
        }

        if (Schema::hasTable('rooms') && Schema::hasColumn('rooms', 'status')) {
            DB::statement("ALTER TABLE `rooms` MODIFY `status` varchar(50) DEFAULT 'available'");
        }

        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'status')) {
            DB::statement("ALTER TABLE `bookings` MODIFY `status` varchar(50) DEFAULT 'pending'");
        }
    }

    private function createSqlOnlyTables(): void
    {
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action')->nullable();
                $table->text('description')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->text('message')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    private function alignUsers(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable();
            }

            if (!Schema::hasColumn('users', 'remember_token')) {
                $table->rememberToken();
            }

            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable();
            }

            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role', 50)->default('frontdesk');
            }

            if (!Schema::hasColumn('users', 'role_id')) {
                $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('users', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function alignGuests(): void
    {
        if (!Schema::hasTable('guests')) {
            return;
        }

        Schema::table('guests', function (Blueprint $table) {
            foreach (['gender', 'id_type', 'city', 'country', 'loyalty_tier'] as $column) {
                if (!Schema::hasColumn('guests', $column)) {
                    $table->string($column)->nullable();
                }
            }

            if (!Schema::hasColumn('guests', 'notes')) {
                $table->text('notes')->nullable();
            }

            if (!Schema::hasColumn('guests', 'total_stays')) {
                $table->unsignedInteger('total_stays')->default(0);
            }

            if (!Schema::hasColumn('guests', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function alignRoomTypes(): void
    {
        if (!Schema::hasTable('room_types')) {
            return;
        }

        Schema::table('room_types', function (Blueprint $table) {
            if (!Schema::hasColumn('room_types', 'slug')) {
                $table->string('slug')->nullable();
            }

            if (!Schema::hasColumn('room_types', 'amenities')) {
                $table->json('amenities')->nullable();
            }

            if (!Schema::hasColumn('room_types', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        if (Schema::hasColumn('room_types', 'slug')) {
            DB::table('room_types')
                ->whereNull('slug')
                ->orderBy('id')
                ->get(['id', 'name'])
                ->each(function ($roomType): void {
                    DB::table('room_types')
                        ->where('id', $roomType->id)
                        ->update(['slug' => str($roomType->name)->slug()->toString()]);
                });
        }
    }

    private function alignRooms(): void
    {
        if (!Schema::hasTable('rooms')) {
            return;
        }

        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }

            if (!Schema::hasColumn('rooms', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('rooms', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function alignBookings(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'room_type_id')) {
                $table->foreignId('room_type_id')->nullable()->constrained('room_types')->nullOnDelete();
            }

            if (!Schema::hasColumn('bookings', 'check_in')) {
                $table->date('check_in')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'check_out')) {
                $table->date('check_out')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'check_in_date')) {
                $table->date('check_in_date')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'check_out_date')) {
                $table->date('check_out_date')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'actual_check_in')) {
                $table->timestamp('actual_check_in')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'actual_check_out')) {
                $table->timestamp('actual_check_out')->nullable();
            }

            if (!Schema::hasColumn('bookings', 'adults')) {
                $table->integer('adults')->default(1);
            }

            if (!Schema::hasColumn('bookings', 'children')) {
                $table->integer('children')->default(0);
            }

            if (!Schema::hasColumn('bookings', 'num_adults')) {
                $table->unsignedInteger('num_adults')->default(1);
            }

            if (!Schema::hasColumn('bookings', 'num_children')) {
                $table->unsignedInteger('num_children')->default(0);
            }

            if (!Schema::hasColumn('bookings', 'source')) {
                $table->string('source')->default('direct');
            }

            foreach (['subtotal', 'tax_amount', 'discount_amount'] as $column) {
                if (!Schema::hasColumn('bookings', $column)) {
                    $table->decimal($column, 10, 2)->default(0);
                }
            }

            if (!Schema::hasColumn('bookings', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        $this->copyColumnIfBothExist('bookings', 'check_in', 'check_in_date');
        $this->copyColumnIfBothExist('bookings', 'check_out', 'check_out_date');
        $this->copyColumnIfBothExist('bookings', 'adults', 'num_adults');
        $this->copyColumnIfBothExist('bookings', 'children', 'num_children');
    }

    private function alignPayments(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'method')) {
                $table->string('method', 50)->nullable();
            }

            if (!Schema::hasColumn('payments', 'payment_method')) {
                $table->string('payment_method')->nullable();
            }

            if (!Schema::hasColumn('payments', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable();
            }

            if (!Schema::hasColumn('payments', 'status')) {
                $table->string('status')->default('completed');
            }

            if (!Schema::hasColumn('payments', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('payments', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        if (Schema::hasColumn('payments', 'method') && Schema::hasColumn('payments', 'payment_method')) {
            DB::table('payments')
                ->whereNull('payment_method')
                ->update([
                    'payment_method' => DB::raw("CASE method WHEN 'mobile_money' THEN 'mpesa' WHEN 'bank_transfer' THEN 'bank' ELSE method END"),
                ]);
        }
    }

    private function alignHousekeepingTasks(): void
    {
        if (!Schema::hasTable('housekeeping_tasks')) {
            return;
        }

        Schema::table('housekeeping_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('housekeeping_tasks', 'task_type')) {
                $table->string('task_type')->default('cleaning');
            }

            if (!Schema::hasColumn('housekeeping_tasks', 'completed_at')) {
                $table->timestamp('completed_at')->nullable();
            }

            if (!Schema::hasColumn('housekeeping_tasks', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function alignFolioCharges(): void
    {
        if (!Schema::hasTable('folio_charges')) {
            return;
        }

        Schema::table('folio_charges', function (Blueprint $table) {
            if (!Schema::hasColumn('folio_charges', 'posted_by')) {
                $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('folio_charges', 'charged_at')) {
                $table->timestamp('charged_at')->nullable();
            }

            if (!Schema::hasColumn('folio_charges', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function alignSettings(): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        Schema::table('settings', function (Blueprint $table) {
            if (!Schema::hasColumn('settings', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (!Schema::hasColumn('settings', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    private function copyColumnIfBothExist(string $table, string $from, string $to): void
    {
        if (!Schema::hasColumn($table, $from) || !Schema::hasColumn($table, $to)) {
            return;
        }

        DB::table($table)
            ->whereNull($to)
            ->update([$to => DB::raw($from)]);
    }
};
