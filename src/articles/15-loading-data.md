---
title: "Loading Data"
description: "Fetch data for your pages with SvelteKit load functions. Learn the difference between server and universal loads, and how to handle errors."
tags: ["svelte", "sveltekit", "data-fetching"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 16
---

# Lesson 15: Loading Data

Every real app needs to fetch data. SvelteKit's load functions make this elegant — your data arrives before the page renders.

## The Load Function

Create `+page.js` next to your `+page.svelte`:

```javascript
// src/routes/blog/+page.js
export async function load({ fetch }) {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  return { posts };
}
```

```svelte
<!-- src/routes/blog/+page.svelte -->
<script>
  export let data
</script>

<h1>Blog</h1>

{#each data.posts as post}
  <article>
    <h2>{post.title}</h2>
    <p>{post.excerpt}</p>
  </article>
{/each}
```

The load function runs before rendering. Whatever you return is available as `data` in your component.

## Using Parameters

Access route parameters:

```javascript
// src/routes/blog/[slug]/+page.js
export async function load({ params, fetch }) {
  const response = await fetch(`/api/posts/${params.slug}`);

  if (!response.ok) {
    return {
      status: 404,
      error: new Error("Post not found"),
    };
  }

  const post = await response.json();
  return { post };
}
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  export let data
</script>

<article>
  <h1>{data.post.title}</h1>
  <div>{@html data.post.content}</div>
</article>
```

## Server vs Universal Loads

There are two types of load functions:

**Universal loads (`+page.js`)**

- Run on server during SSR
- Run in browser during client navigation
- Can't access databases directly
- Can access both browser and server APIs

**Server loads (`+page.server.js`)**

- Only run on the server
- Can access databases, file system, secrets
- Better for sensitive data

```javascript
// src/routes/dashboard/+page.server.js
import { db } from "$lib/server/database";

export async function load({ locals }) {
  // This only runs on the server
  // Safe to use database connections, API keys, etc.

  const user = locals.user;
  if (!user) {
    return { redirect: "/login" };
  }

  const data = await db.query("SELECT * FROM user_data WHERE user_id = ?", [
    user.id,
  ]);

  return { userData: data };
}
```

## The fetch Function

Always use the `fetch` from the load function arguments:

```javascript
// ✅ Correct
export async function load({ fetch }) {
  const data = await fetch("/api/data").then((r) => r.json());
  return { data };
}

// ❌ Don't do this
export async function load() {
  const data = await fetch("/api/data").then((r) => r.json()); // Wrong fetch!
  return { data };
}
```

SvelteKit's `fetch`:

- Works during SSR (the global `fetch` doesn't exist on the server in all environments)
- Preserves cookies automatically
- Can make relative requests
- Gets deduplicated when called multiple times with the same URL

## Error Handling

Throw errors to trigger error pages:

```javascript
// src/routes/blog/[slug]/+page.js
import { error } from "@sveltejs/kit";

export async function load({ params, fetch }) {
  const response = await fetch(`/api/posts/${params.slug}`);

  if (response.status === 404) {
    throw error(404, "Post not found");
  }

  if (!response.ok) {
    throw error(500, "Failed to load post");
  }

  return { post: await response.json() };
}
```

The error page (`+error.svelte`) receives the status and message.

## Redirects

Redirect from load functions:

```javascript
// src/routes/old-page/+page.js
import { redirect } from "@sveltejs/kit";

export function load() {
  throw redirect(301, "/new-page");
}
```

Status codes:

- `301` — Permanent redirect (search engines update)
- `302` — Temporary redirect
- `303` — See other (after form submission)
- `307` — Temporary, preserve method
- `308` — Permanent, preserve method

## Layout Data

Layouts can load data too:

```javascript
// src/routes/+layout.server.js
export async function load({ locals }) {
  return {
    user: locals.user,
  };
}
```

Child pages inherit parent layout data:

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script>
  export let data

  // data.user comes from layout
  // data.dashboardData comes from this page's load
</script>

<p>Welcome, {data.user.name}</p>
```

## Depending on Parent Data

Access parent data in load functions:

```javascript
// src/routes/dashboard/settings/+page.server.js
export async function load({ parent }) {
  const { user } = await parent();

  // Now use user to load settings
  const settings = await db.getSettings(user.id);

  return { settings };
}
```

## Invalidation

Data can become stale. Invalidate and reload:

```svelte
<script>
  import { invalidate, invalidateAll } from '$app/navigation'

  async function refresh() {
    // Invalidate specific endpoint
    await invalidate('/api/posts')

    // Or invalidate everything
    await invalidateAll()
  }
</script>

<button onclick={refresh}>Refresh</button>
```

Mark data as depending on a URL:

```javascript
// src/routes/blog/+page.js
export async function load({ fetch, depends }) {
  depends("app:posts"); // Custom dependency key

  const posts = await fetch("/api/posts").then((r) => r.json());
  return { posts };
}
```

```svelte
<script>
  import { invalidate } from '$app/navigation'

  // Invalidate by custom key
  async function refresh() {
    await invalidate('app:posts')
  }
</script>
```

## Comparing to Nuxt

Nuxt's data fetching:

```vue
<script setup>
const { data: posts } = await useFetch("/api/posts");
</script>
```

SvelteKit:

```javascript
// +page.js
export async function load({ fetch }) {
  const posts = await fetch("/api/posts").then((r) => r.json());
  return { posts };
}
```

```svelte
<!-- +page.svelte -->
<script>
  export let data
</script>

{#each data.posts as post}...{/each}
```

Nuxt integrates data fetching in the component. SvelteKit separates it into load files. Both approaches work — SvelteKit's is more explicit.

## Practical Example

A complete blog post page:

```javascript
// src/routes/blog/[slug]/+page.server.js
import { error } from "@sveltejs/kit";
import { db } from "$lib/server/database";

export async function load({ params }) {
  const post = await db.getPost(params.slug);

  if (!post) {
    throw error(404, "Post not found");
  }

  const relatedPosts = await db.getRelatedPosts(post.id, 3);

  // Increment view count (server-only side effect)
  await db.incrementViews(post.id);

  return {
    post,
    relatedPosts,
  };
}
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  export let data
</script>

<svelte:head>
  <title>{data.post.title}</title>
  <meta name="description" content={data.post.excerpt} />
</svelte:head>

<article>
  <h1>{data.post.title}</h1>
  <time>{new Date(data.post.date).toLocaleDateString()}</time>

  <div class="content">
    {@html data.post.content}
  </div>
</article>

{#if data.relatedPosts.length}
  <aside>
    <h2>Related Posts</h2>
    <ul>
      {#each data.relatedPosts as post}
        <li>
          <a href="/blog/{post.slug}">{post.title}</a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
```

## Key Takeaways

- `+page.js` loads data before rendering (runs on server and client)
- `+page.server.js` loads data on server only (safe for secrets)
- Use the provided `fetch` for proper SSR and cookie handling
- `throw error()` for error pages, `throw redirect()` for redirects
- Layout data is inherited by child pages
- Use `invalidate()` to refresh data without navigation

Next: [Lesson 16: Form Actions](/articles/16-form-actions)
