---
title: "Error Handling"
description: "Handle errors gracefully in SvelteKit. Learn about error pages, the error() helper, expected vs unexpected errors, and hooks."
tags: ["svelte", "sveltekit", "errors"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 19
---

# Lesson 18: Error Handling

Things go wrong. Users visit pages that don't exist. APIs fail. Data is invalid. SvelteKit gives you tools to handle all of this gracefully.

## Expected Errors

Use the `error()` helper for expected errors — things you anticipate and want to handle:

```javascript
// src/routes/blog/[slug]/+page.server.js
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const post = await db.getPost(params.slug);

  if (!post) {
    throw error(404, "Post not found");
  }

  return { post };
}
```

This renders your error page with status 404.

## The Error Page

Create `+error.svelte` to customize error display:

```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/stores'
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>

  {#if $page.status === 404}
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go home</a>
  {:else}
    <p>Something went wrong. Please try again.</p>
    <button onclick={() => location.reload()}>Retry</button>
  {/if}
</div>

<style>
  .error-page {
    text-align: center;
    padding: 4rem 2rem;
  }

  h1 {
    font-size: 4rem;
    margin: 0;
    color: #e53e3e;
  }
</style>
```

## Error Page Hierarchy

Error pages follow the layout hierarchy. You can have different error pages for different sections:

```
src/routes/
├── +error.svelte           # Default error page
├── +layout.svelte
├── +page.svelte
├── admin/
│   ├── +error.svelte       # Admin-specific errors
│   ├── +layout.svelte
│   └── +page.svelte
└── api/
    └── [...]/+server.js    # API errors return JSON, not HTML
```

The nearest `+error.svelte` up the tree handles the error.

## Rich Error Objects

Pass more data in errors:

```javascript
import { error } from "@sveltejs/kit";

throw error(404, {
  message: "Post not found",
  code: "POST_NOT_FOUND",
  postId: params.id,
});
```

Access it in your error page:

```svelte
<script>
  import { page } from '$app/stores'
</script>

{#if $page.error?.code === 'POST_NOT_FOUND'}
  <p>We couldn't find post {$page.error.postId}</p>
{/if}
```

## Unexpected Errors

Unexpected errors are unhandled exceptions. SvelteKit catches them and shows your error page, but the details are hidden in production (to avoid leaking sensitive info).

```javascript
export async function load() {
  // This throws an unexpected error
  const data = JSON.parse("invalid json");
  return { data };
}
```

In development, you see the full error. In production, users see a generic "Internal Error" message.

## The handleError Hook

Catch and process unexpected errors:

```javascript
// src/hooks.server.js
export function handleError({ error, event, status, message }) {
  // Log to your error tracking service
  console.error("Unexpected error:", error);

  // Send to Sentry, LogRocket, etc.
  // Sentry.captureException(error)

  // Return what the user should see
  return {
    message: "Something went wrong",
    code: "UNEXPECTED_ERROR",
  };
}
```

This runs for both server errors and client errors (with `hooks.client.js`).

## Form Action Errors

Return errors from form actions without throwing:

```javascript
import { fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email");

    if (!email) {
      return fail(400, {
        error: "Email is required",
        values: { email },
      });
    }

    // ...
  },
};
```

`fail()` returns an error without redirecting to an error page. The form stays on screen with the error message.

## API Route Errors

For API routes, return JSON errors:

```javascript
// src/routes/api/users/[id]/+server.js
import { json, error } from "@sveltejs/kit";

export async function GET({ params }) {
  const user = await db.getUser(params.id);

  if (!user) {
    // Option 1: Throw error (returns HTML error page)
    // throw error(404, 'User not found')

    // Option 2: Return JSON error (better for APIs)
    return json(
      { error: "User not found", code: "USER_NOT_FOUND" },
      { status: 404 }
    );
  }

  return json(user);
}
```

For pure JSON APIs, prefer returning JSON errors rather than throwing.

## Try-Catch in Load Functions

Wrap risky operations:

```javascript
export async function load({ fetch }) {
  try {
    const response = await fetch("/api/data");

    if (!response.ok) {
      throw error(response.status, "Failed to load data");
    }

    return { data: await response.json() };
  } catch (e) {
    // Re-throw SvelteKit errors
    if (e.status) throw e;

    // Handle unexpected errors
    console.error("Load error:", e);
    throw error(500, "Something went wrong");
  }
}
```

## Client-Side Error Handling

Handle errors in components:

```svelte
<script>
  import { onMount } from 'svelte'

  let data = null
  let error = null
  let loading = true

  onMount(async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      data = await response.json()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <div class="error">
    <p>Error: {error}</p>
    <button onclick={() => location.reload()}>Retry</button>
  </div>
{:else}
  <DataDisplay {data} />
{/if}
```

## Global Error Boundary

For truly unexpected client errors, use `handleError` in `hooks.client.js`:

```javascript
// src/hooks.client.js
export function handleError({ error, event, status, message }) {
  // Log to analytics
  console.error("Client error:", error);

  // Could show a toast notification
  // showToast('Something went wrong')

  return {
    message: "An error occurred",
  };
}
```

## Not Found Pages

A special 404 page:

```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/stores'
</script>

{#if $page.status === 404}
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <p>Looking for <code>{$page.url.pathname}</code>?</p>
    <a href="/">Back to home</a>
  </div>
{:else}
  <div class="error">
    <h1>Error {$page.status}</h1>
    <p>{$page.error?.message || 'Something went wrong'}</p>
  </div>
{/if}
```

## Practical Example: Robust Data Loading

```javascript
// src/routes/dashboard/+page.server.js
import { error, redirect } from "@sveltejs/kit";

export async function load({ locals, fetch }) {
  // Auth check
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  // Load multiple resources with error handling
  const [userResult, statsResult, notificationsResult] =
    await Promise.allSettled([
      fetch("/api/user/profile").then((r) => r.json()),
      fetch("/api/user/stats").then((r) => r.json()),
      fetch("/api/user/notifications").then((r) => r.json()),
    ]);

  // User profile is required
  if (userResult.status === "rejected") {
    throw error(500, "Failed to load profile");
  }

  // Stats and notifications are optional - use defaults if failed
  return {
    user: userResult.value,
    stats: statsResult.status === "fulfilled" ? statsResult.value : null,
    notifications:
      notificationsResult.status === "fulfilled"
        ? notificationsResult.value
        : [],
    errors: {
      stats: statsResult.status === "rejected",
      notifications: notificationsResult.status === "rejected",
    },
  };
}
```

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script>
  export let data
</script>

<h1>Welcome, {data.user.name}</h1>

{#if data.errors.stats}
  <div class="warning">Stats temporarily unavailable</div>
{:else if data.stats}
  <StatsPanel stats={data.stats} />
{/if}

{#if data.errors.notifications}
  <div class="warning">Couldn't load notifications</div>
{:else}
  <NotificationList items={data.notifications} />
{/if}
```

## Key Takeaways

- Use `error()` for expected errors (404, 403, etc.)
- Create `+error.svelte` for custom error pages
- Error pages follow the layout hierarchy
- `fail()` returns form errors without redirecting
- `handleError` hook catches unexpected errors
- Return JSON errors from API routes
- Use `Promise.allSettled` for partial failure tolerance
- Log errors to tracking services in production

Next: [Lesson 19: Deployment](/articles/19-deployment)
