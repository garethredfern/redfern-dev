---
title: "Testing API Endpoints with Insomnia or Postman"
description: "Testing your API endpoints is essential when building a Laravel API. Here's how to use Insomnia or Postman with Sanctum token authentication."
tags: ["laravel", "api", "testing", "postman", "insomnia"]
pubDate: "2024-01-04T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 4
---

To test the API while building endpoints, you can use [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/). Both tools let you interact with your API and save authentication tokens.

While the SPA uses cookie-based session authentication, it's simpler to use token-based authentication for API testing. **Don't use tokens for your SPA** - cookies and sessions are more secure for browser-based applications.

## Add HasApiTokens Trait

In Laravel 11, the User model should already have the `HasApiTokens` trait if you ran `artisan install:api`. Verify it's there:

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    // ...
}
```

## Create Token Controller

Generate a controller for issuing tokens:

```bash
sail artisan make:controller Api/TokenController --invokable
```

Update `app/Http/Controllers/Api/TokenController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TokenController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'device_name' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }
}
```

## Add API Routes

In `routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\TokenController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/sanctum/token', TokenController::class);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
```

## Testing with Insomnia/Postman

### 1. Get a Token

Send a POST request to `http://localhost/api/sanctum/token`:

```json
{
  "email": "test@example.com",
  "password": "password",
  "device_name": "insomnia"
}
```

You'll receive a response like:

```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

### 2. Use the Token

For subsequent requests, add the token to the Authorization header:

```
Authorization: Bearer 1|abc123xyz...
```

Also set the Accept header:

```
Accept: application/json
```

### 3. Test Protected Endpoints

Send a GET request to `http://localhost/api/user` with the headers above. You should receive the authenticated user's data.

## Environment Variables in Insomnia

You can save the token as an environment variable for convenience:

1. Create an environment in Insomnia
2. Add a variable: `token` = `1|abc123xyz...`
3. Use `{{ token }}` in your Authorization header

## Revoking Tokens

To revoke all tokens for a user (useful for logout):

```php
$request->user()->tokens()->delete();
```

To revoke just the current token:

```php
$request->user()->currentAccessToken()->delete();
```

---

_Next up: Using Laravel Telescope for debugging your API._
