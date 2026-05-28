<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('rooms', 'status')) {
            Schema::table('rooms', function (Blueprint $table) {
                $table->string('status')->default('available');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('rooms', 'status')) {
            Schema::table('rooms', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
