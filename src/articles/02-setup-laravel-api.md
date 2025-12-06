---
title: "Setting Up Laravel 11 with Sanctum and Fortify"
description: "How to set up Laravel 11 with Sanctum and Fortify for use as a headless API that your Vue SPA can consume."
tags: ["laravel", "sanctum", "fortify", "api", "authentication"]
pubDate: "2024-01-02T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 2
---

First, create a new Laravel project. We'll use [Laravel Sail](https://laravel.com/docs/11.x/sail) for local development with Docker.

```bash
curl -s "https://laravel.build/laravel-api" | bash

cd laravel-api
./vendor/bin/sail up -d
```

Your API will be accessible at `http://localhost`.

## Environment Configuration

Update your `.env` file with these settings:

```bash
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=sail
DB_PASSWORD=password

MAIL_FROM_ADDRESS=hello@example.com
```

## Running Artisan Commands

With Sail, prefix artisan commands with `sail`:

```bash
./vendor/bin/sail artisan migrate
```

**Tip:** Add an alias to your shell config for convenience:

```bash
alias sail='./vendor/bin/sail'
```

## Install Sanctum

Laravel 11 includes Sanctum by default, but you need to publish its configuration and run migrations:

```bash
sail artisan install:api
```

This command:

- Publishes the Sanctum configuration
- Adds the API routes file
- Runs the necessary migrations

Now configure Sanctum for SPA authentication. Add the following to your `.env` file:

```bash
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
SPA_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Note:** Port 5173 is Vite's default dev server port for the Vue SPA.

In `config/sanctum.php`, the stateful domains are already configured to read from the environment variable, but verify it looks like this:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    Sanctum::currentApplicationUrlWithPort()
))),
```

## Configure CORS

In Laravel 11, update `config/cors.php`:

```php
return [
    'paths' => [
        'api/*',
        'login',
        'logout',
        'register',
        'user/password',
        'forgot-password',
        'reset-password',
        'sanctum/csrf-cookie',
        'user/profile-information',
        'email/verification-notification',
    ],

    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

The `supports_credentials` setting is critical - it enables cookies to be sent cross-origin.

## Install Fortify

Fortify provides the authentication backend (login, register, password reset, etc.):

```bash
sail composer require laravel/fortify
sail artisan fortify:install
sail artisan migrate
```

Register the Fortify service provider. In Laravel 11, add it to `bootstrap/providers.php`:

```php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
];
```

## Configure Fortify

Update `config/fortify.php`:

```php
// Redirect to SPA after authentication
'home' => env('SPA_URL', 'http://localhost:5173') . '/dashboard',

// Disable Laravel views - the SPA handles all UI
'views' => false,

// Enable the features you need
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::updateProfileInformation(),
    Features::updatePasswords(),
],
```

## API Middleware Configuration

In Laravel 11, middleware is configured in `bootstrap/app.php`. Add Sanctum's stateful middleware:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
})
```

This automatically adds `EnsureFrontendRequestsAreStateful` to your API routes.

## Database Seeding

Create a test user in `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'email_verified_at' => now(),
    ]);
}
```

Run the migrations and seeder:

```bash
sail artisan migrate:fresh --seed
```

The default password for factory users is `password`.

---

_Next up: Setting up the Vue 3 SPA with Vite and Pinia._
