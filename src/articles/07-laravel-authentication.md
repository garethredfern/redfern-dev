---
title: "Laravel 11 API Authentication with Sanctum and Fortify"
description: "How to set up full authentication using Laravel Sanctum and Fortify including CORS, email verification, and password resets."
tags: ["laravel", "sanctum", "fortify", "authentication", "api"]
pubDate: "2024-01-07T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 7
---

Now that we have Sanctum and Fortify installed, let's configure them properly for SPA authentication.

## Understanding SPA Authentication

Sanctum provides two authentication methods:

1. **Token-based** - For mobile apps and third-party API access
2. **Cookie/Session-based** - For SPAs on the same top-level domain (what we're using)

Cookie-based authentication is more secure for SPAs because:

- Tokens can't be stolen via XSS (cookies are httpOnly)
- CSRF protection is built-in
- Session management is handled by Laravel

## CORS Configuration

Your SPA and API must share the same top-level domain. In development:

- API: `http://localhost` (port 80)
- SPA: `http://localhost:5173` (Vite's default)

Both use `localhost` as the top-level domain, so cookies will work.

Verify your `config/cors.php`:

```php
<?php

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

The `supports_credentials` setting is essential - it enables the `Access-Control-Allow-Credentials` header, allowing cookies to be sent cross-origin.

## Fortify Configuration

Update `config/fortify.php`:

```php
<?php

use Laravel\Fortify\Features;

return [
    'guard' => 'web',

    'middleware' => ['web'],

    'auth_middleware' => 'auth',

    // Redirect to SPA after authentication
    'home' => env('SPA_URL', 'http://localhost:5173') . '/dashboard',

    'prefix' => '',

    'domain' => null,

    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
    ],

    // Disable views - the SPA handles all UI
    'views' => false,

    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::updateProfileInformation(),
        Features::updatePasswords(),
    ],
];
```

## Handling Already Authenticated Users

When an authenticated user tries to access login/register, Laravel should return a JSON response instead of redirecting.

In Laravel 11, create or update `app/Http/Middleware/RedirectIfAuthenticated.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Already authenticated.'], 200);
                }

                return redirect(env('SPA_URL', '/') . '/dashboard');
            }
        }

        return $next($request);
    }
}
```

Register it in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
    ]);
})
```

## Email Verification

Ensure your User model implements `MustVerifyEmail`:

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, Notifiable;

    // ...
}
```

## Password Reset

Configure the password reset URL to point to your SPA. In `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return env('SPA_URL') . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
```

## API Routes

Protected routes use the `auth:sanctum` middleware. In `routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
});
```

## Testing Authentication

You can test the authentication flow:

1. **Get CSRF Cookie**: `GET /sanctum/csrf-cookie`
2. **Register**: `POST /register` with name, email, password, password_confirmation
3. **Login**: `POST /login` with email, password
4. **Get User**: `GET /api/user` (should return authenticated user)
5. **Logout**: `POST /logout`

Use Telescope to inspect requests and debug any issues.

---

_Next up: Setting up authentication in the Vue SPA._
