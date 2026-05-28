<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('guests')) {
            return;
        }

        Schema::create('guests', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->timestamps();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->text('notes')->nullable();
            $table->string('loyalty_tier')->nullable();
            $table->unsignedInteger('total_stays')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
