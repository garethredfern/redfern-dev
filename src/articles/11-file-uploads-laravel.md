---
title: "File Uploads with Laravel and S3-Compatible Storage"
description: "Set up file uploads in Laravel 11 using Flysystem with S3-compatible storage like Digital Ocean Spaces or AWS S3."
tags: ["laravel", "file-uploads", "s3", "flysystem", "storage"]
pubDate: "2024-01-11T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 11
---

Laravel uses Flysystem for file storage, which provides a unified API for local storage, S3, and S3-compatible services like Digital Ocean Spaces.

## Install S3 Driver

Laravel 11 requires the Flysystem S3 adapter:

```bash
sail composer require league/flysystem-aws-s3-v3 "^3.0"
```

## Configure Storage

Add your credentials to `.env`:

```bash
# For AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-bucket
AWS_USE_PATH_STYLE_ENDPOINT=false

# For Digital Ocean Spaces
DO_SPACES_KEY=your-key
DO_SPACES_SECRET=your-secret
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
DO_SPACES_REGION=fra1
DO_SPACES_BUCKET=your-bucket
```

Add a custom disk for Digital Ocean Spaces in `config/filesystems.php`:

```php
'disks' => [
    // ... existing disks

    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
        'url' => env('AWS_URL'),
        'endpoint' => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        'throw' => false,
    ],

    'spaces' => [
        'driver' => 's3',
        'key' => env('DO_SPACES_KEY'),
        'secret' => env('DO_SPACES_SECRET'),
        'region' => env('DO_SPACES_REGION'),
        'bucket' => env('DO_SPACES_BUCKET'),
        'endpoint' => env('DO_SPACES_ENDPOINT'),
        'url' => env('DO_SPACES_URL'),
        'visibility' => 'public',
        'throw' => false,
    ],
],
```

## Add Avatar Column to Users

Create a migration:

```bash
sail artisan make:migration add_avatar_to_users_table
```

Update the migration:

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
            $table->string('avatar')->nullable()->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};
```

Run the migration:

```bash
sail artisan migrate
```

Update the User model's `$fillable` array:

```php
protected $fillable = [
    'name',
    'email',
    'password',
    'is_admin',
    'avatar',
];
```

## Create Avatar Controller

```bash
sail artisan make:controller Api/AvatarController
```

Update `app/Http/Controllers/Api/AvatarController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'], // Max 2MB
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            $oldPath = parse_url($user->avatar, PHP_URL_PATH);
            Storage::disk('spaces')->delete(ltrim($oldPath, '/'));
        }

        // Store new avatar
        $path = $request->file('avatar')->store(
            'avatars/' . $user->id,
            'spaces'
        );

        // Get the full URL
        $url = Storage::disk('spaces')->url($path);

        $user->update(['avatar' => $url]);

        return new UserResource($user);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        if ($user->avatar) {
            $path = parse_url($user->avatar, PHP_URL_PATH);
            Storage::disk('spaces')->delete(ltrim($path, '/'));

            $user->update(['avatar' => null]);
        }

        return new UserResource($user);
    }
}
```

## Add Routes

Update `routes/api.php`:

```php
use App\Http\Controllers\Api\AvatarController;

Route::middleware('auth:sanctum')->group(function () {
    // ... other routes

    Route::post('/user/avatar', [AvatarController::class, 'store']);
    Route::delete('/user/avatar', [AvatarController::class, 'destroy']);
});
```

## Update UserResource

Add the avatar field to `app/Http/Resources/UserResource.php`:

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'email_verified_at' => $this->email_verified_at,
        'is_admin' => $this->isAdmin(),
        'avatar' => $this->avatar,
        'created_at' => $this->created_at,
    ];
}
```

## Testing Locally

For local development, you can use the `local` disk instead:

```php
// In AvatarController, change 'spaces' to 'public'
$path = $request->file('avatar')->store(
    'avatars/' . $user->id,
    'public'
);

$url = Storage::disk('public')->url($path);
```

Make sure to create the symbolic link:

```bash
sail artisan storage:link
```

## CORS for Direct Uploads

If you want to upload directly to S3/Spaces from the browser (bypassing your server), you'll need to configure CORS on your bucket. For Digital Ocean Spaces, go to Settings > CORS Configurations and add:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

_Next up: Building the file upload component in Vue._
