---
title: "Component Lifecycle"
description: "Understand when Svelte components mount, update, and destroy. Master onMount, onDestroy, beforeUpdate, afterUpdate, and tick."
tags: ["svelte", "lifecycle", "components"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 11
---

## Lesson 10: Component Lifecycle

Components aren't static. They're created, updated, and eventually destroyed. Svelte 5 simplifies lifecycle management with the `$effect` rune.

## The $effect Rune

In Svelte 5, most lifecycle needs are handled by `$effect`. It runs after the component mounts and re-runs when its dependencies change:

```svelte
<script>
  let data = $state(null)

  $effect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => data = json)
  })
</script>

{#if data}
  <pre>{JSON.stringify(data, null, 2)}</pre>
{:else}
  <p>Loading...</p>
{/if}
```

**Why use `$effect` instead of running code directly?**

Code in `$effect` only runs in the browser, not during server-side rendering. This makes it safe for `fetch`, DOM APIs, and browser-only code.

**Cleanup:**

Return a function from `$effect` to run cleanup when the component unmounts or before the effect re-runs:

```svelte
<script>
  let seconds = $state(0)

  $effect(() => {
    const interval = setInterval(() => {
      seconds++
    }, 1000)

    // Cleanup function
    return () => {
      clearInterval(interval)
    }
  })
</script>

<p>Elapsed: {seconds} seconds</p>
```

This pattern is essential for preventing memory leaks.

## Legacy Lifecycle Functions

Svelte 5 still supports the traditional lifecycle functions for compatibility, but `$effect` handles most use cases more elegantly:

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  // onMount still works
  onMount(() => {
    console.log('Component mounted')
    return () => console.log('Cleanup')
  })

  // onDestroy still works
  onDestroy(() => {
    console.log('Component destroying')
  })
</script>
```

**When to use which:**

- **`$effect`** — Default choice. Handles mount, cleanup, and reactive updates
- **`onMount`** — When you specifically need something to run only once at mount
- **`onDestroy`** — When you have cleanup not tied to a reactive effect

## Scroll Position Example

Here's a common pattern for auto-scrolling a chat container:

```svelte
<script>
  let messages = $state([])
  let div
  let autoscroll = $state(false)

  $effect.pre(() => {
    // Check scroll position before DOM updates
    if (div) {
      autoscroll = div.scrollHeight - div.scrollTop === div.clientHeight
    }
  })

  $effect(() => {
    // After DOM updates, scroll if needed
    if (autoscroll && div) {
      div.scrollTop = div.scrollHeight
    }
  })
</script>

<div bind:this={div} class="messages">
  {#each messages as message}
    <p>{message}</p>
  {/each}
</div>
```

`$effect.pre` runs before DOM updates, while regular `$effect` runs after.

## tick

Svelte batches DOM updates for performance. Sometimes you need to wait for the DOM to update before doing something.

```svelte
<script>
  import { tick } from 'svelte'

  let text = $state('')
  let input

  async function addExclamation() {
    text += '!'

    // DOM hasn't updated yet
    console.log(input.value) // Old value

    await tick()

    // Now DOM is updated
    console.log(input.value) // New value with !

    // Select all text
    input.select()
  }
</script>

<input bind:value={text} bind:this={input} />
<button onclick={addExclamation}>Add !</button>
```

Without `await tick()`, `input.select()` would run before the DOM updated.

## Comparing to Vue

Vue's lifecycle hooks:

```vue
<script setup>
import { onMounted, onUnmounted, watch } from "vue";

onMounted(() => {
  console.log("Mounted");
});

onUnmounted(() => {
  console.log("Unmounted");
});

watch(someValue, () => {
  console.log("Value changed");
});
</script>
```

Svelte 5:

```svelte
<script>
  $effect(() => {
    console.log('Mounted')
    return () => console.log('Unmounted')
  })

  $effect(() => {
    console.log('someValue changed:', someValue)
  })
</script>
```

Svelte's `$effect` combines mounting, cleanup, and watching into one unified pattern. Vue has `nextTick`, Svelte has `tick`.

## Common Patterns

**Fetching data:**

```svelte
<script>
  let { userId } = $props()

  let user = $state(null)
  let loading = $state(true)
  let error = $state(null)

  $effect(() => {
    loading = true
    error = null

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => user = data)
      .catch(e => error = e.message)
      .finally(() => loading = false)
  })
</script>
```

**Setting up event listeners:**

```svelte
<script>
  let windowWidth = $state(0)

  $effect(() => {
    function handleResize() {
      windowWidth = window.innerWidth
    }

    handleResize() // Initial value
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })
</script>

<p>Window width: {windowWidth}px</p>
```

**Third-party library integration:**

```svelte
<script>
  import Chart from 'chart.js/auto'

  let { data } = $props()

  let canvas

  $effect(() => {
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value)
        }]
      }
    })

    return () => chart.destroy()
  })
</script>

<canvas bind:this={canvas} />
```

## Effects and SSR

Important: `$effect` doesn't run during server-side rendering. This is intentional — the DOM doesn't exist on the server.

This means you can safely use browser-only APIs inside `$effect`:

```svelte
<script>
  let position = $state({ x: 0, y: 0 })

  $effect(() => {
    function handleMouseMove(event) {
      position = { x: event.clientX, y: event.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  })
</script>
```

If you try to access `window` directly in the script (outside `$effect`), you'll get errors during SSR.

## Multiple Effects

You can have multiple effects, each handling different concerns:

```svelte
<script>
  // Track window size
  $effect(() => {
    console.log('Setting up resize listener')
    // ...
  })

  // Track mouse position
  $effect(() => {
    console.log('Setting up mouse listener')
    // ...
  })
</script>
```

Each effect runs independently and has its own cleanup.

## Key Takeaways

- `$effect` runs after mount and when dependencies change
- Return a cleanup function to prevent memory leaks
- `$effect.pre` runs before DOM updates
- `tick()` returns a promise that resolves after pending updates
- Effects don't run during SSR — safe for browser APIs
- Legacy `onMount`/`onDestroy` still work but `$effect` is preferred
- Always clean up subscriptions, intervals, and event listeners

Next: [Lesson 11: Stores for State](/articles/11-stores-for-state)
