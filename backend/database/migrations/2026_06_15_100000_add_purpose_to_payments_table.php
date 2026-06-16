<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // "deposit" or "full" — tracks whether this payment is a partial
            // deposit (balance to be settled on arrival) or the full amount.
            // Nullable for legacy rows and recorded manual cash/card payments
            // where the receptionist may simply mark the booking paid.
            $table->string('purpose', 16)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('purpose');
        });
    }
};
