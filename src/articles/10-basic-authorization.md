---
title: "Basic Authorization with Admin Roles"
description: "How to set up basic authorization in a Laravel 11 API and Vue 3 SPA, adding an is_admin field to control access to protected content."
tags: ["laravel", "vue", "authorization", "admin", "roles"]
pubDate: "2024-01-10T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 10
---

While authentication determines if a user has access to your application, authorization determines what they can see once logged in. Let's implement a simple admin role system.

## Add is_admin Column

Create a migration to add the admin column:

```bash
sail artisan make:migration add_is_admin_to_users_table
```

Update the migration file:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
```

Run the migration:

```bash
sail artisan migrate
```

## Update User Model

Add the `is_admin` field to the casts array and create a helper method:

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->is_admin;
    }
}
```

## Create UserResource

Generate an API resource to control what user data is returned:

```bash
sail artisan make:resource UserResource
```

Update `app/Http/Resources/UserResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'is_admin' => $this->isAdmin(),
            'created_at' => $this->created_at,
        ];
    }
}
```

## Protect API Endpoints

Create a UserController with authorization:

```bash
sail artisan make:controller Api/UserController
```

Update `app/Http/Controllers/Api/UserController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|Response
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return UserResource::collection(User::paginate(15));
    }

    public function show(Request $request, User $user): UserResource|Response
    {
        // Users can view their own profile, admins can view anyone
        if (!$request->user()->isAdmin() && $request->user()->id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return new UserResource($user);
    }
}
```

Update `routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
});
```

## Vue 3 Authorization

The auth store already has an `isAdmin` computed property. Let's use it to protect routes.

Update `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... other routes
    {
      path: "/users",
      name: "users",
      component: () => import("@/views/UsersView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.user && !auth.isLoading) {
    await auth.fetchUser();
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: "dashboard" };
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Check admin requirement
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: "dashboard" };
  }
});

export default router;
```

## Conditional UI Rendering

Use the `isAdmin` computed property to show/hide admin-only content:

```vue
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
</script>

<template>
  <nav>
    <RouterLink to="/dashboard">Dashboard</RouterLink>
    <RouterLink to="/settings">Settings</RouterLink>
    <RouterLink v-if="auth.isAdmin" to="/users">Manage Users</RouterLink>
  </nav>
</template>
```

## Create Admin User in Seeder

Update `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    // Regular user
    User::factory()->create([
        'name' => 'Test User',
        'email' => 'user@example.com',
        'email_verified_at' => now(),
        'is_admin' => false,
    ]);

    // Admin user
    User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'email_verified_at' => now(),
        'is_admin' => true,
    ]);
}
```

Run the seeder:

```bash
sail artisan migrate:fresh --seed
```

Now you can log in with `admin@example.com` / `password` to access admin features.

---

_Next up: Uploading files to cloud storage with Laravel._
