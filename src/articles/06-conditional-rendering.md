---
title: "Conditional Rendering"
description: "Control what appears in your UI with Svelte's if blocks. Learn {#if}, {:else}, {:else if}, and when to use them."
tags: ["svelte", "templates", "conditionals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 7
---

## Lesson 6: Conditional Rendering

Not everything should show all the time. Svelte's `{#if}` blocks let you conditionally render parts of your UI based on state.

## Basic If Blocks

```svelte
<script>
  let loggedIn = false
</script>

{#if loggedIn}
  <p>Welcome back!</p>
{/if}

<button onclick={() => loggedIn = !loggedIn}>
  {loggedIn ? 'Log out' : 'Log in'}
</button>
```

When `loggedIn` is `true`, the paragraph appears. When it's `false`, it's not in the DOM at all — not hidden, completely absent.

## If-Else

```svelte
{#if loggedIn}
  <Dashboard />
{:else}
  <LoginForm />
{/if}
```

Note the syntax: `{:else}` uses a colon because it continues the block started by `{#if}`.

## If-Else-If Chains

```svelte
<script>
  let status = 'pending'
</script>

{#if status === 'loading'}
  <Spinner />
{:else if status === 'error'}
  <ErrorMessage />
{:else if status === 'success'}
  <Results />
{:else}
  <EmptyState />
{/if}
```

You can chain as many `{:else if}` blocks as you need.

## The Syntax Pattern

Svelte's template blocks follow a consistent pattern:

- `{#` starts a block
- `{:` continues a block
- `{/` ends a block

So `{#if}`, `{:else}`, `{/if}`.

## Truthy and Falsy Values

Svelte uses JavaScript's truthy/falsy rules:

```svelte
<script>
  let items = []
  let user = null
  let count = 0
</script>

{#if items.length}
  <ItemList {items} />
{:else}
  <p>No items yet</p>
{/if}

{#if user}
  <p>Hello, {user.name}</p>
{/if}

{#if count}
  <p>Count: {count}</p>
{/if}
```

Falsy values: `false`, `0`, `''`, `null`, `undefined`, `NaN`

Everything else is truthy, including empty arrays and objects.

## Nested Conditions

You can nest if blocks:

```svelte
{#if user}
  {#if user.isAdmin}
    <AdminPanel />
  {:else}
    <UserDashboard />
  {/if}
{:else}
  <LoginPrompt />
{/if}
```

But consider if this is readable. Sometimes separate components or derived values are clearer:

```svelte
<script>
  let user = $state({ isAdmin: true })

  let showAdmin = $derived(user && user.isAdmin)
</script>

{#if !user}
  <LoginPrompt />
{:else if showAdmin}
  <AdminPanel />
{:else}
  <UserDashboard />
{/if}
```

## Comparing to Vue

Vue's conditional directives:

```vue
<p v-if="loggedIn">Welcome back!</p>
<p v-else>Please log in</p>

<div v-if="status === 'loading'">Loading...</div>
<div v-else-if="status === 'error'">Error!</div>
<div v-else>Done</div>
```

Svelte's approach:

```svelte
{#if loggedIn}
  <p>Welcome back!</p>
{:else}
  <p>Please log in</p>
{/if}

{#if status === 'loading'}
  <div>Loading...</div>
{:else if status === 'error'}
  <div>Error!</div>
{:else}
  <div>Done</div>
{/if}
```

Vue attaches conditions to elements. Svelte wraps elements in condition blocks. Both work well — it's a matter of taste.

One advantage of Svelte's approach: you can conditionally render multiple elements without a wrapper:

```svelte
{#if showDetails}
  <h2>Details</h2>
  <p>Some details here</p>
  <p>More details here</p>
{/if}
```

In Vue, you'd need a wrapper element or `<template>`.

## Common Patterns

**Loading states:**

```svelte
<script>
  let loading = $state(true)
  let data = $state(null)
  let error = $state(null)

  async function loadData() {
    loading = true
    error = null

    try {
      const response = await fetch('/api/data')
      data = await response.json()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }
</script>

{#if loading}
  <div class="spinner">Loading...</div>
{:else if error}
  <div class="error">
    <p>Something went wrong: {error}</p>
    <button onclick={loadData}>Try again</button>
  </div>
{:else if data}
  <DataDisplay {data} />
{:else}
  <p>No data available</p>
{/if}
```

**Feature flags:**

```svelte
<script>
  let { features = { darkMode: true, betaFeatures: false } } = $props()
</script>

{#if features.darkMode}
  <DarkModeToggle />
{/if}

{#if features.betaFeatures}
  <BetaWarning />
  <ExperimentalFeature />
{/if}
```

**Permission checks:**

```svelte
<script>
  let { user } = $props()

  let canEdit = $derived(user?.permissions?.includes('edit'))
  let canDelete = $derived(user?.permissions?.includes('delete'))
</script>

{#if canEdit}
  <button onclick={handleEdit}>Edit</button>
{/if}

{#if canDelete}
  <button onclick={handleDelete}>Delete</button>
{/if}
```

**Form validation feedback:**

```svelte
<script>
  let email = $state('')
  let touched = $state(false)

  let isValid = $derived(email.includes('@'))
  let showError = $derived(touched && !isValid)
</script>

<input
  type="email"
  bind:value={email}
  onblur={() => touched = true}
/>

{#if showError}
  <p class="error">Please enter a valid email</p>
{/if}
```

## Conditional Classes and Styles

For simple visibility toggling, sometimes CSS is better:

```svelte
<script>
  let visible = true
</script>

<!-- Remove from DOM -->
{#if visible}
  <div>I disappear completely</div>
{/if}

<!-- Hide with CSS -->
<div class:hidden={!visible}>
  I stay in the DOM but become invisible
</div>

<style>
  .hidden {
    display: none;
  }
</style>
```

Use `{#if}` when:

- The content is expensive to render
- You want to unmount components (trigger cleanup)
- The content shouldn't be in the DOM at all (accessibility, SEO)

Use CSS when:

- You're toggling frequently and want to avoid re-renders
- You need transitions on the element
- The content should remain in the DOM (form inputs keeping values)

## Key Takeaways

- `{#if}`, `{:else if}`, `{:else}`, `{/if}` control conditional rendering
- Content inside false conditions is removed from the DOM entirely
- JavaScript truthy/falsy rules apply
- Multiple elements can be wrapped without needing a container
- Use `$derived()` to simplify complex conditions
- CSS hiding is sometimes better than conditional rendering

Next: [Lesson 7: Lists and Iteration](/articles/07-lists-and-iteration)
