---
title: "Shaping API Responses with Laravel Resources"
description: "Laravel API resources provide fine-grained control over JSON responses, letting you transform models and include relationships consistently."
tags: ["laravel", "api", "resources", "json", "rest"]
pubDate: "2024-01-13T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 13
---

Laravel API resources let you shape the JSON responses your API returns. They sit between your models and the JSON output, giving you full control over what data is exposed and how it's formatted.

## Creating a Resource

Generate a resource with Artisan:

```bash
sail artisan make:resource UserResource
```

This creates `app/Http/Resources/UserResource.php`:

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
            'avatar' => $this->avatar,
            'email_verified_at' => $this->email_verified_at,
            'is_admin' => $this->isAdmin(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

## Using Resources

Return a single resource:

```php
use App\Http\Resources\UserResource;
use App\Models\User;

Route::get('/users/{user}', function (User $user) {
    return new UserResource($user);
});
```

This outputs:

```json
{
  "data": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "avatar": null,
    "email_verified_at": "2024-01-01T00:00:00.000000Z",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000000Z"
  }
}
```

Laravel automatically wraps the response in a `data` key, following the JSON:API specification.

## Resource Collections

For multiple resources, use the `collection` method:

```php
Route::get('/users', function () {
    return UserResource::collection(User::all());
});
```

## Pagination

Laravel's pagination integrates seamlessly with resources:

```php
Route::get('/users', function () {
    return UserResource::collection(User::paginate(15));
});
```

This returns paginated data with metadata:

```json
{
  "data": [
    { "id": 1, "name": "User 1", ... },
    { "id": 2, "name": "User 2", ... }
  ],
  "links": {
    "first": "http://localhost/api/users?page=1",
    "last": "http://localhost/api/users?page=5",
    "prev": null,
    "next": "http://localhost/api/users?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "path": "http://localhost/api/users",
    "per_page": 15,
    "to": 15,
    "total": 75
  }
}
```

## Conditional Attributes

Include attributes only when certain conditions are met:

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,

        // Only include for the authenticated user viewing their own profile
        'is_admin' => $this->when(
            $request->user()?->id === $this->id || $request->user()?->isAdmin(),
            $this->isAdmin()
        ),

        // Only include if not null
        'avatar' => $this->whenNotNull($this->avatar),

        // Only include when the relationship is loaded
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

## Including Relationships

Load and include relationships:

```php
// In your controller
return new UserResource(
    User::with(['posts', 'comments'])->find($id)
);

// In your resource
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        'comments_count' => $this->whenCounted('comments'),
    ];
}
```

## Resource Collections with Additional Data

Create a dedicated collection class for additional metadata:

```bash
sail artisan make:resource UserCollection
```

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_admins' => $this->collection->where('is_admin', true)->count(),
            ],
        ];
    }
}
```

Use it:

```php
return new UserCollection(User::paginate(15));
```

## Customizing the Wrapper

Remove the `data` wrapper for a specific resource:

```php
public static $wrap = null;
```

Or globally in `AppServiceProvider`:

```php
use Illuminate\Http\Resources\Json\JsonResource;

public function boot(): void
{
    JsonResource::withoutWrapping();
}
```

## Adding Meta Data

Add metadata to individual responses:

```php
return (new UserResource($user))
    ->additional([
        'meta' => [
            'permissions' => $user->getAllPermissions(),
        ],
    ]);
```

---

_Next up: Handling API errors gracefully in your Vue SPA._
