---
title: "Introduction to SvelteKit"
description: "Discover what SvelteKit adds to Svelte. Learn about project structure, the dev server, and how SvelteKit handles routing, SSR, and more."
tags: ["svelte", "sveltekit", "fundamentals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 14
---

## Lesson 13: Introduction to SvelteKit

You've learned Svelte — the component framework. Now let's add SvelteKit — the application framework that turns Svelte components into full websites and apps.

## What SvelteKit Adds

SvelteKit provides everything you need for production applications:

- **Routing** — File-based, with dynamic routes and layouts
- **Server-side rendering (SSR)** — Pages render on the server first
- **Data loading** — Fetch data before rendering
- **Form handling** — Progressive enhancement for forms
- **API routes** — Build backend endpoints
- **Build optimization** — Code splitting, preloading, adapters for deployment

Think of it like Nuxt for Vue, or Next.js for React.

## Creating a Project

Start fresh:

```bash
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
```

The CLI asks questions:

- **Template** — Start with Skeleton for learning
- **TypeScript** — Your choice (recommended for larger projects)
- **ESLint/Prettier** — Yes for team projects

## Project Structure

```
my-app/
├── src/
│   ├── routes/           # Pages and layouts
│   │   ├── +page.svelte  # Home page (/)
│   │   └── +layout.svelte
│   ├── lib/              # Shared code
│   │   └── components/
│   └── app.html          # HTML template
├── static/               # Static assets
├── svelte.config.js      # SvelteKit config
├── vite.config.js        # Vite config
└── package.json
```

Key directories:

- `src/routes/` — Every file here becomes a route
- `src/lib/` — Shared utilities, components, stores (alias: `$lib`)
- `static/` — Files served as-is (favicon, robots.txt)

## The Routes Directory

This is where the magic happens. The file structure defines your URLs:

```
src/routes/
├── +page.svelte          # /
├── about/
│   └── +page.svelte      # /about
├── blog/
│   ├── +page.svelte      # /blog
│   └── [slug]/
│       └── +page.svelte  # /blog/anything
└── api/
    └── users/
        └── +server.js    # /api/users (API endpoint)
```

## Your First Page

`src/routes/+page.svelte` is your home page:

```svelte
<script>
  let count = 0
</script>

<h1>Welcome to SvelteKit</h1>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

It's just a Svelte component. Nothing special — SvelteKit figures out the rest.

## The Layout System

Layouts wrap pages. `+layout.svelte` in any folder applies to that folder and its children:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css'
</script>

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/blog">Blog</a>
</nav>

<main>
  <slot />
</main>

<footer>
  <p>© 2025 My Site</p>
</footer>
```

The `<slot />` is where the page content goes. Every page in `routes/` inherits this layout.

## Nested Layouts

Layouts can nest:

```
src/routes/
├── +layout.svelte        # Global layout
├── +page.svelte
└── dashboard/
    ├── +layout.svelte    # Dashboard layout (adds to global)
    ├── +page.svelte      # /dashboard
    └── settings/
        └── +page.svelte  # /dashboard/settings
```

```svelte
<!-- src/routes/dashboard/+layout.svelte -->
<aside>
  <nav>
    <a href="/dashboard">Overview</a>
    <a href="/dashboard/settings">Settings</a>
  </nav>
</aside>

<div class="content">
  <slot />
</div>
```

Dashboard pages get both the global nav and the dashboard sidebar.

## Navigation

For internal links, use regular `<a>` tags:

```svelte
<a href="/about">About</a>
<a href="/blog/my-post">Read Post</a>
```

SvelteKit intercepts these and does client-side navigation — no full page reload.

For programmatic navigation:

```svelte
<script>
  import { goto } from '$app/navigation'

  function handleLogin() {
    // ... login logic
    goto('/dashboard')
  }
</script>
```

## The $app Modules

SvelteKit provides special imports:

```svelte
<script>
  // Navigation utilities
  import { goto, invalidate } from '$app/navigation'

  // Current page info
  import { page } from '$app/stores'

  // Environment info
  import { browser, dev } from '$app/environment'
</script>

<p>Current path: {$page.url.pathname}</p>

{#if browser}
  <p>Running in browser</p>
{/if}

{#if dev}
  <p>Development mode</p>
{/if}
```

## Comparing to Nuxt

If you know Nuxt, here's how concepts map:

| Nuxt             | SvelteKit              |
| ---------------- | ---------------------- |
| `pages/`         | `src/routes/`          |
| `layouts/`       | `+layout.svelte` files |
| `[id].vue`       | `[id]/+page.svelte`    |
| `useFetch`       | `load` functions       |
| `server/api/`    | `+server.js` files     |
| `nuxt.config.ts` | `svelte.config.js`     |

The concepts are similar. The syntax differs.

## The Dev Server

Run `npm run dev` and you get:

- Hot module replacement (instant updates)
- Server-side rendering
- API routes
- Error overlay

The dev experience is excellent. Changes appear instantly.

## Building for Production

```bash
npm run build
npm run preview
```

SvelteKit builds optimized output. What you get depends on your adapter (more in lesson 19).

## Configuration

`svelte.config.js`:

```javascript
import adapter from "@sveltejs/adapter-auto";

export default {
  kit: {
    adapter: adapter(),
    alias: {
      $components: "src/lib/components",
    },
  },
};
```

Most projects need minimal configuration. SvelteKit has sensible defaults.

## What's Coming

Over the next lessons, we'll cover:

- **Routing** — Dynamic routes, route groups, optional parameters
- **Loading Data** — Server and universal load functions
- **Form Actions** — Handle form submissions with progressive enhancement
- **API Routes** — Build backend endpoints
- **Error Handling** — Custom error pages
- **Deployment** — Adapters for different platforms

## Key Takeaways

- SvelteKit is an application framework built on Svelte
- File-based routing: folder structure = URL structure
- Layouts wrap pages and can nest
- Use `$lib` for shared code, `$app` for SvelteKit utilities
- Regular `<a>` tags do client-side navigation automatically
- The dev server provides SSR and hot reloading

Next: [Lesson 14: Routing and Pages](/articles/14-routing-and-pages)
