---
title: "Component Lifecycle"
description: "Understand when Svelte components mount, update, and destroy. Master onMount, onDestroy, beforeUpdate, afterUpdate, and tick."
tags: ["svelte", "lifecycle", "components"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 11
---

## Lesson 10: Component Lifecycle

Components aren't static. They're created, updated, and eventually destroyed. Svelte gives you hooks to run code at each stage.

## The Lifecycle Functions

Svelte provides four lifecycle functions:

- `onMount` — runs after the component is first rendered
- `onDestroy` — runs before the component is removed
- `beforeUpdate` — runs before the DOM updates
- `afterUpdate` — runs after the DOM updates

Plus a utility function:

- `tick` — returns a promise that resolves when pending state changes are applied

## onMount

The most commonly used lifecycle function. It runs once, after the component is first rendered to the DOM.

```svelte
<script>
  import { onMount } from 'svelte'

  let data = null

  onMount(async () => {
    const response = await fetch('/api/data')
    data = await response.json()
  })
</script>

{#if data}
  <pre>{JSON.stringify(data, null, 2)}</pre>
{:else}
  <p>Loading...</p>
{/if}
```

**Why not just fetch in the script?**

The script runs during component initialization, which might happen on the server (with SSR). `onMount` only runs in the browser, where `fetch` and DOM APIs are available.

**Cleanup:**

If you return a function from `onMount`, it runs when the component is destroyed:

```svelte
<script>
  import { onMount } from 'svelte'

  let seconds = 0

  onMount(() => {
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

## onDestroy

Runs before the component is removed from the DOM.

```svelte
<script>
  import { onDestroy } from 'svelte'

  // Subscribe to something
  const subscription = eventBus.subscribe('message', handleMessage)

  onDestroy(() => {
    // Clean up
    subscription.unsubscribe()
  })

  function handleMessage(msg) {
    console.log(msg)
  }
</script>
```

You can use either the cleanup return from `onMount` or a separate `onDestroy`. They're equivalent for most cases.

## beforeUpdate and afterUpdate

These run before and after DOM updates. They're less common but useful for specific scenarios.

```svelte
<script>
  import { beforeUpdate, afterUpdate } from 'svelte'

  let messages = []
  let div
  let autoscroll = false

  beforeUpdate(() => {
    // Check if we're scrolled to the bottom
    if (div) {
      autoscroll = div.scrollHeight - div.scrollTop === div.clientHeight
    }
  })

  afterUpdate(() => {
    // If we were at the bottom, stay at the bottom
    if (autoscroll) {
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

This pattern keeps a chat scroll pinned to the bottom as new messages arrive, but only if the user was already at the bottom.

## tick

Svelte batches DOM updates for performance. Sometimes you need to wait for the DOM to update before doing something.

```svelte
<script>
  import { tick } from 'svelte'

  let text = ''
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
import { onMounted, onUnmounted, onBeforeUpdate, onUpdated } from "vue";

onMounted(() => {
  console.log("Mounted");
});

onUnmounted(() => {
  console.log("Unmounted");
});
</script>
```

Svelte:

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  onMount(() => console.log('Mounted'))
  onDestroy(() => console.log('Destroyed'))
</script>
```

Very similar. Vue has `nextTick`, Svelte has `tick`.

## Common Patterns

**Fetching data:**

```svelte
<script>
  import { onMount } from 'svelte'

  export let userId

  let user = null
  let loading = true
  let error = null

  onMount(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      user = await response.json()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  })
</script>
```

**Setting up event listeners:**

```svelte
<script>
  import { onMount } from 'svelte'

  let windowWidth

  onMount(() => {
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
  import { onMount, onDestroy } from 'svelte'
  import Chart from 'chart.js/auto'

  export let data

  let canvas
  let chart

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value)
        }]
      }
    })
  })

  onDestroy(() => {
    if (chart) {
      chart.destroy()
    }
  })
</script>

<canvas bind:this={canvas} />
```

## Lifecycle and SSR

Important: `onMount` doesn't run during server-side rendering. This is intentional — the DOM doesn't exist on the server.

This means you can safely use browser-only APIs inside `onMount`:

```svelte
<script>
  import { onMount } from 'svelte'

  let position = { x: 0, y: 0 }

  onMount(() => {
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

If you try to access `window` directly in the script (outside `onMount`), you'll get errors during SSR.

## Multiple Lifecycle Calls

You can call lifecycle functions multiple times:

```svelte
<script>
  import { onMount } from 'svelte'

  // Set up first thing
  onMount(() => {
    console.log('First mount callback')
  })

  // Set up second thing
  onMount(() => {
    console.log('Second mount callback')
  })
</script>
```

Both callbacks run in order. This is useful when different parts of your component have their own setup needs.

## Key Takeaways

- `onMount` runs once after first render — use for fetching, DOM setup
- Return a cleanup function from `onMount` to run on destroy
- `onDestroy` runs before component removal
- `beforeUpdate` and `afterUpdate` run around DOM updates
- `tick()` returns a promise that resolves after pending updates
- `onMount` doesn't run during SSR — safe for browser APIs
- Always clean up subscriptions, intervals, and event listeners

Next: [Lesson 11: Stores for State](/articles/11-stores-for-state)
