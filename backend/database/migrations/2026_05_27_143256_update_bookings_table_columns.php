<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'check_in') && !Schema::hasColumn('bookings', 'check_in_date')) {
                $table->renameColumn('check_in', 'check_in_date');
            }

            if (Schema::hasColumn('bookings', 'check_out') && !Schema::hasColumn('bookings', 'check_out_date')) {
                $table->renameColumn('check_out', 'check_out_date');
            }

            if (!Schema::hasColumn('bookings', 'num_adults')) {
                $table->integer('num_adults')->default(1);
            }

            if (!Schema::hasColumn('bookings', 'num_children')) {
                $table->integer('num_children')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'check_in_date') && !Schema::hasColumn('bookings', 'check_in')) {
                $table->renameColumn('check_in_date', 'check_in');
            }

            if (Schema::hasColumn('bookings', 'check_out_date') && !Schema::hasColumn('bookings', 'check_out')) {
                $table->renameColumn('check_out_date', 'check_out');
            }

            $dropColumns = array_filter(['num_adults', 'num_children'], fn ($column) => Schema::hasColumn('bookings', $column));

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
