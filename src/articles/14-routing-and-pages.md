---
title: "Routing and Pages"
description: "Master SvelteKit's file-based routing system. Learn dynamic routes, route groups, optional parameters, and layout patterns."
tags: ["svelte", "sveltekit", "routing"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 15
---

# Lesson 14: Routing and Pages

SvelteKit's routing is file-based. Your folder structure becomes your URL structure. Simple concept, powerful results.

## Basic Routes

Every `+page.svelte` creates a route:

```
src/routes/
├── +page.svelte          # /
├── about/
│   └── +page.svelte      # /about
├── contact/
│   └── +page.svelte      # /contact
└── pricing/
    └── +page.svelte      # /pricing
```

The file name is always `+page.svelte`. The folder name becomes the URL segment.

## Dynamic Routes

Square brackets create dynamic segments:

```
src/routes/
└── blog/
    ├── +page.svelte         # /blog
    └── [slug]/
        └── +page.svelte     # /blog/anything
```

Access the parameter in your component:

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  import { page } from '$app/stores'
</script>

<h1>Post: {$page.params.slug}</h1>
```

Or better, load data based on it (covered next lesson):

```svelte
<script>
  export let data
</script>

<h1>{data.post.title}</h1>
```

## Multiple Parameters

Stack them:

```
src/routes/
└── [category]/
    └── [product]/
        └── +page.svelte    # /shoes/nike-air-max
```

```svelte
<script>
  import { page } from '$app/stores'
</script>

<p>Category: {$page.params.category}</p>
<p>Product: {$page.params.product}</p>
```

## Rest Parameters

Capture multiple segments with `[...rest]`:

```
src/routes/
└── docs/
    └── [...path]/
        └── +page.svelte    # /docs/getting-started/installation
```

```svelte
<script>
  import { page } from '$app/stores'

  // path = "getting-started/installation"
  $: segments = $page.params.path.split('/')
</script>
```

## Optional Parameters

Double brackets make parameters optional:

```
src/routes/
└── blog/
    └── [[page]]/
        └── +page.svelte    # /blog and /blog/2
```

```svelte
<script>
  import { page } from '$app/stores'

  // undefined for /blog, "2" for /blog/2
  $: pageNum = $page.params.page ?? '1'
</script>
```

## Route Groups

Parentheses create groups that don't affect URLs:

```
src/routes/
├── (marketing)/
│   ├── +layout.svelte      # Marketing layout
│   ├── about/
│   │   └── +page.svelte    # /about
│   └── pricing/
│       └── +page.svelte    # /pricing
└── (app)/
    ├── +layout.svelte      # App layout
    └── dashboard/
        └── +page.svelte    # /dashboard
```

The URLs are `/about`, `/pricing`, `/dashboard` — no `(marketing)` or `(app)` in the URL. But each group can have its own layout.

Use this to:

- Apply different layouts to different sections
- Organize code without affecting URLs
- Share layouts between specific routes

## Breaking Out of Layouts

Sometimes a page shouldn't inherit layouts. Use `@`:

```
src/routes/
├── +layout.svelte           # Default layout
├── +page.svelte             # / (uses layout)
└── print/
    └── [id]/
        └── +page@.svelte    # /print/123 (no layout!)
```

`+page@.svelte` resets to no layout. `+page@(group).svelte` resets to a specific group's layout.

## Matching Parameters

Add validation to parameters:

```javascript
// src/params/integer.js
export function match(param) {
  return /^\d+$/.test(param);
}
```

```
src/routes/
└── blog/
    └── [id=integer]/
        └── +page.svelte    # /blog/123 matches, /blog/abc doesn't
```

Create matchers in `src/params/`:

```javascript
// src/params/slug.js
export function match(param) {
  return /^[a-z0-9-]+$/.test(param);
}

// src/params/uuid.js
export function match(param) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    param
  );
}
```

## Layouts in Detail

`+layout.svelte` files wrap child pages:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
</script>

<Header />

<main>
  <slot />
</main>

<Footer />
```

Layouts can have their own data loading:

```javascript
// src/routes/+layout.js
export async function load({ fetch }) {
  const user = await fetch("/api/user").then((r) => r.json());
  return { user };
}
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  export let data
</script>

<nav>
  {#if data.user}
    <span>Welcome, {data.user.name}</span>
  {/if}
</nav>

<slot />
```

Child pages inherit layout data.

## Page Options

Control page behavior with `+page.js`:

```javascript
// src/routes/about/+page.js

// Prerender this page at build time
export const prerender = true;

// Disable SSR for this page
export const ssr = false;

// Disable client-side routing for this page
export const csr = true;
```

Options can also go in `+layout.js` to affect all children.

## Error Pages

Create `+error.svelte` to handle errors:

```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/stores'
</script>

<h1>{$page.status}: {$page.error.message}</h1>

{#if $page.status === 404}
  <p>This page doesn't exist.</p>
  <a href="/">Go home</a>
{:else}
  <p>Something went wrong.</p>
{/if}
```

## Comparing to Nuxt

| Nuxt                  | SvelteKit                       |
| --------------------- | ------------------------------- |
| `pages/index.vue`     | `routes/+page.svelte`           |
| `pages/[id].vue`      | `routes/[id]/+page.svelte`      |
| `pages/[...slug].vue` | `routes/[...slug]/+page.svelte` |
| `layouts/default.vue` | `routes/+layout.svelte`         |
| Directory in `pages/` | Directory in `routes/`          |

SvelteKit's folder-based approach with `+page.svelte` is different but logical.

## Navigation Helpers

```svelte
<script>
  import { page } from '$app/stores'
  import { goto, beforeNavigate, afterNavigate } from '$app/navigation'

  // Current URL info
  $: currentPath = $page.url.pathname
  $: searchParams = $page.url.searchParams

  // Programmatic navigation
  function goToDashboard() {
    goto('/dashboard')
  }

  // With options
  function replaceHistory() {
    goto('/new-page', { replaceState: true })
  }

  // Navigation guards
  beforeNavigate(({ cancel, to }) => {
    if (hasUnsavedChanges && !confirm('Leave page?')) {
      cancel()
    }
  })

  afterNavigate(({ from, to }) => {
    // Analytics, scroll restoration, etc.
  })
</script>

<nav>
  <a href="/" class:active={currentPath === '/'}>Home</a>
  <a href="/about" class:active={currentPath === '/about'}>About</a>
</nav>
```

## Practical Example

A typical blog structure:

```
src/routes/
├── +layout.svelte              # Site layout
├── +page.svelte                # / (home)
├── (marketing)/
│   ├── +layout.svelte          # Marketing header/footer
│   ├── about/
│   │   └── +page.svelte        # /about
│   └── contact/
│       └── +page.svelte        # /contact
├── blog/
│   ├── +layout.svelte          # Blog layout (sidebar)
│   ├── +page.svelte            # /blog (list)
│   └── [slug]/
│       └── +page.svelte        # /blog/my-post
└── dashboard/
    ├── +layout.svelte          # Dashboard layout (auth required)
    ├── +page.svelte            # /dashboard
    └── settings/
        └── +page.svelte        # /dashboard/settings
```

## Key Takeaways

- File structure = URL structure
- `+page.svelte` creates routes, `+layout.svelte` wraps them
- `[param]` for dynamic segments, `[...rest]` for catch-all
- `[[param]]` for optional parameters
- `(group)` for organization without URL changes
- Use `@` to break out of layouts
- Parameter matchers add validation

Next: [Lesson 15: Loading Data](/articles/15-loading-data)
