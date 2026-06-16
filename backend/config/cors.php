<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Comma-separated list of allowed origins via CORS_ALLOWED_ORIGINS in .env.
    // Production should set this to its real frontend origin(s). Local dev
    // falls back to the Vite/CRA defaults below.
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
    )) ?: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ]),

    // Patterns matched against the request Origin header. Useful for LAN dev
    // (192.168.x.x) or for wildcard subdomains in production. Override via
    // CORS_ALLOWED_ORIGIN_PATTERNS (comma-separated) or leave empty.
    'allowed_origins_patterns' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))
    )) ?: [
        // LAN dev: allow any RFC1918 private IP on a non-standard port.
        '#^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$#',
        // Vercel preview + production deployments. Every branch deploy gets
        // a unique *.vercel.app subdomain, so use a pattern.
        '#^https://[a-z0-9-]+\.vercel\.app$#',
    ]),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];