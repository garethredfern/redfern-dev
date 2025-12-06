---
title: "What's Next"
description: "Continue your Svelte journey. Explore advanced topics, the ecosystem, and resources for going deeper with Svelte and SvelteKit."
tags: ["svelte", "sveltekit", "resources"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 21
---

## Lesson 20: What's Next

You've covered a lot of ground. You now understand Svelte's reactivity, component patterns, and SvelteKit's full-stack capabilities. Here's where to go from here.

## What We Covered

**Svelte fundamentals:**

- Components, reactivity, props, events
- Conditional rendering, loops, two-way binding
- Slots, lifecycle, stores, context

**SvelteKit essentials:**

- File-based routing, layouts, dynamic routes
- Load functions, form actions, API routes
- Error handling, deployment

This is enough to build real applications. But there's more to explore.

## Advanced Svelte Topics

### Transitions and Animations

Svelte has built-in transition support:

```svelte
<script>
  import { fade, fly, slide } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  let visible = true
  let items = [1, 2, 3]
</script>

{#if visible}
  <div transition:fade={{ duration: 300 }}>
    Fades in and out
  </div>
{/if}

<div in:fly={{ y: 200 }} out:fade>
  Different in/out transitions
</div>

{#each items as item (item)}
  <div animate:flip={{ duration: 300 }}>
    {item}
  </div>
{/each}
```

### Custom Stores

Build sophisticated state management:

```javascript
import { writable, derived, get } from "svelte/store";

function createTodoStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    add: (text) =>
      update((todos) => [
        ...todos,
        {
          id: Date.now(),
          text,
          done: false,
        },
      ]),
    toggle: (id) =>
      update((todos) =>
        todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      ),
    remove: (id) => update((todos) => todos.filter((t) => t.id !== id)),
    clear: () => set([]),
  };
}

export const todos = createTodoStore();
export const remaining = derived(
  todos,
  ($todos) => $todos.filter((t) => !t.done).length
);
```

### Actions

Reusable element behaviors:

```javascript
// src/lib/actions/clickOutside.js
export function clickOutside(node, callback) {
  function handleClick(event) {
    if (!node.contains(event.target)) {
      callback();
    }
  }

  document.addEventListener("click", handleClick, true);

  return {
    destroy() {
      document.removeEventListener("click", handleClick, true);
    },
  };
}
```

```svelte
<script>
  import { clickOutside } from '$lib/actions/clickOutside'

  let open = false
</script>

{#if open}
  <div use:clickOutside={() => open = false}>
    Click outside to close
  </div>
{/if}
```

### Special Elements

```svelte
<!-- Set document head -->
<svelte:head>
  <title>Page Title</title>
  <meta name="description" content="..." />
</svelte:head>

<!-- Bind to window -->
<svelte:window bind:innerWidth={width} onkeydown={handleKey} />

<!-- Bind to document -->
<svelte:document onvisibilitychange={handleVisibility} />

<!-- Bind to body -->
<svelte:body onmouseenter={handleEnter} />

<!-- Dynamic components -->
<svelte:component this={currentComponent} />
```

## Advanced SvelteKit Topics

### Hooks

Intercept requests and responses:

```javascript
// src/hooks.server.js
export async function handle({ event, resolve }) {
  // Run before every request
  const session = event.cookies.get("session");

  if (session) {
    event.locals.user = await getUser(session);
  }

  const response = await resolve(event);

  // Modify response
  return response;
}

// Transform HTML
export async function handle({ event, resolve }) {
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%theme%", "dark"),
  });
}
```

### Parallel Loading

Load data in parallel for better performance:

```javascript
// +page.js
export async function load({ fetch }) {
  const [posts, categories, featured] = await Promise.all([
    fetch("/api/posts").then((r) => r.json()),
    fetch("/api/categories").then((r) => r.json()),
    fetch("/api/featured").then((r) => r.json()),
  ]);

  return { posts, categories, featured };
}
```

### Streaming

Stream data to the client:

```javascript
export async function load({ fetch }) {
  return {
    // Available immediately
    title: "My Page",

    // Streams in when ready
    comments: fetch("/api/comments").then((r) => r.json()),
  };
}
```

```svelte
<h1>{data.title}</h1>

{#await data.comments}
  <p>Loading comments...</p>
{:then comments}
  {#each comments as comment}
    <Comment {comment} />
  {/each}
{/await}
```

### Service Workers

Add offline support:

```javascript
// src/service-worker.js
import { build, files, version } from "$service-worker";

const CACHE = `cache-${version}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([...build, ...files]))
  );
});
```

## The Ecosystem

### UI Libraries

- **Skeleton** — Tailwind-based component library
- **shadcn-svelte** — Port of shadcn/ui
- **Flowbite Svelte** — Tailwind components
- **Carbon Components Svelte** — IBM's design system

### Form Libraries

- **Superforms** — Powerful form handling with validation
- **Formsnap** — Accessible form primitives
- **Felte** — Extensible form library

### Data Fetching

- **TanStack Query** — Async state management (works with Svelte)
- **SWR Svelte** — Stale-while-revalidate

### Animation

- **Motion One** — Modern animation library
- **GSAP** — Professional animations (works with Svelte)
- **AutoAnimate** — Automatic animations

### Testing

- **Vitest** — Unit testing
- **Playwright** — End-to-end testing
- **Testing Library** — Component testing

## Learning Resources

### Official

- [Svelte Tutorial](https://learn.svelte.dev) — Interactive official tutorial
- [Svelte Docs](https://svelte.dev/docs) — Reference documentation
- [SvelteKit Docs](https://kit.svelte.dev/docs) — Framework documentation
- [Svelte Discord](https://svelte.dev/chat) — Community chat

### Video Courses

- Joy of Code — YouTube tutorials
- Huntabyte — YouTube deep dives
- Level Up Tutorials — Paid courses

### Blogs and Articles

- [Official Svelte Blog](https://svelte.dev/blog)
- [Josh Collinsworth](https://joshcollinsworth.com) — Excellent articles
- [Dev.to #svelte](https://dev.to/t/svelte)

## Project Ideas

### Beginner

1. **Todo app** with local storage
2. **Weather dashboard** using a public API
3. **Markdown previewer** with live preview
4. **Quiz app** with score tracking

### Intermediate

1. **Blog** with markdown posts and SvelteKit
2. **E-commerce store** with cart and checkout
3. **Real-time chat** with WebSockets
4. **Dashboard** with charts and data tables

### Advanced

1. **Social media clone** with auth, posts, follows
2. **Project management tool** like Trello
3. **Collaborative editor** with real-time sync
4. **CMS** with admin panel and API

## From Vue to Svelte

Since you're coming from Vue, here's a reference of equivalent concepts:

| Vue                    | Svelte                    |
| ---------------------- | ------------------------- |
| `ref()` / `reactive()` | `let variable`            |
| `computed()`           | `$: derived`              |
| `watch()`              | `$: statement`            |
| `v-if` / `v-else`      | `{#if}` / `{:else}`       |
| `v-for`                | `{#each}`                 |
| `v-model`              | `bind:value`              |
| `@click`               | `onclick`                 |
| `defineProps()`        | `export let prop`         |
| `defineEmits()`        | `createEventDispatcher()` |
| `<slot>`               | `<slot>`                  |
| Pinia                  | Svelte stores             |
| provide/inject         | setContext/getContext     |
| Nuxt                   | SvelteKit                 |

## Final Advice

1. **Build something.** The best way to learn is by doing. Pick a project and start.

2. **Read source code.** Look at open-source Svelte projects. See how others solve problems.

3. **Join the community.** The Svelte Discord is welcoming and helpful.

4. **Don't fight the framework.** Svelte has opinions. Embrace them.

5. **Keep it simple.** Svelte's strength is simplicity. Don't over-engineer.

## You're Ready

You have the foundation. Everything else builds on what you've learned. Go build something great.

---

🎉 **Congratulations on completing the course!**

You now have practical knowledge of Svelte and SvelteKit. From reactive variables to full-stack deployment, you understand how all the pieces fit together.

The best learning happens by building. Pick a project, start coding, and refer back to these lessons when you need them.

Happy building!
