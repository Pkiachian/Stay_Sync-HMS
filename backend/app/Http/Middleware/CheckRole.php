<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $allowedRoles = array_merge([$role], $roles);

        if (!in_array($request->user()->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        return $next($request);
    }
}
