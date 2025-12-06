---
title: "Event Handling"
description: "Handle DOM events and create custom component events in Svelte. Learn event modifiers, dispatching, and forwarding patterns."
tags: ["svelte", "events", "components"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 6
---

# Lesson 5: Event Handling

Svelte makes event handling straightforward. DOM events work like you'd expect, and custom events let your components communicate with their parents.

## DOM Events

Bind event handlers with `on` followed by the event name:

```svelte
<button onclick={handleClick}>Click me</button>

<input onkeydown={handleKeydown} />

<form onsubmit={handleSubmit}>
```

Notice: it's `onclick`, not `on:click` (though the old syntax still works for now). This matches standard HTML attributes.

## Inline Handlers

For simple cases, define handlers inline:

```svelte
<script>
  let count = 0
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

Or with the event object:

```svelte
<input onkeydown={(e) => {
  if (e.key === 'Enter') {
    handleSubmit()
  }
}} />
```

## Named Handlers

For more complex logic, use named functions:

```svelte
<script>
  let items = []
  let input = ''

  function handleSubmit(event) {
    event.preventDefault()
    if (input.trim()) {
      items = [...items, input]
      input = ''
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      input = ''
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <input
    bind:value={input}
    onkeydown={handleKeydown}
  />
  <button type="submit">Add</button>
</form>
```

## Event Modifiers

Svelte provides modifiers for common patterns. Add them after the event name with `|`:

```svelte
<!-- Calls event.preventDefault() -->
<form onsubmit|preventDefault={handleSubmit}>

<!-- Calls event.stopPropagation() -->
<button onclick|stopPropagation={handleClick}>

<!-- Only fires once -->
<button onclick|once={handleClick}>

<!-- Only fires if event.target is the element itself -->
<div onclick|self={handleClick}>

<!-- Use passive listener for better scroll performance -->
<div onscroll|passive={handleScroll}>
```

Chain multiple modifiers:

```svelte
<form onsubmit|preventDefault|stopPropagation={handleSubmit}>
```

Common modifiers:

| Modifier                   | Effect                                |
| -------------------------- | ------------------------------------- |
| `preventDefault`           | Calls `event.preventDefault()`        |
| `stopPropagation`          | Calls `event.stopPropagation()`       |
| `stopImmediatePropagation` | Stops other listeners on same element |
| `once`                     | Handler fires at most once            |
| `self`                     | Only fires if target is this element  |
| `passive`                  | Improves scroll performance           |
| `capture`                  | Uses capture phase instead of bubble  |
| `trusted`                  | Only fires for user-initiated events  |

## Custom Component Events

Components can dispatch their own events to communicate with parents.

**Child component (Button.svelte):**

```svelte
<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function handleClick() {
    dispatch('click')
    dispatch('customEvent', { some: 'data' })
  }
</script>

<button onclick={handleClick}>
  <slot />
</button>
```

**Parent component:**

```svelte
<script>
  import Button from './Button.svelte'

  function handleCustomEvent(event) {
    console.log(event.detail) // { some: 'data' }
  }
</script>

<Button
  onclick={() => console.log('clicked')}
  oncustomEvent={handleCustomEvent}
>
  Click me
</Button>
```

The second argument to `dispatch()` becomes `event.detail`.

## Event Forwarding

Sometimes you want to expose a child element's events without handling them yourself. Use the shorthand:

```svelte
<!-- Button.svelte -->
<button onclick>
  <slot />
</button>
```

Just `onclick` with no handler forwards the event. The parent can listen to it directly:

```svelte
<Button onclick={handleClick}>Click</Button>
```

This is useful for wrapper components.

## Comparing to Vue

Here's how Svelte events compare to Vue:

**Vue template events:**

```vue
<button @click="handleClick">Click</button>
<form @submit.prevent="handleSubmit">
```

**Svelte:**

```svelte
<button onclick={handleClick}>Click</button>
<form onsubmit|preventDefault={handleSubmit}>
```

**Vue custom events (emit):**

```vue
<script setup>
const emit = defineEmits(["update", "delete"]);

function save() {
  emit("update", { id: 1, name: "test" });
}
</script>
```

**Svelte:**

```svelte
<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function save() {
    dispatch('update', { id: 1, name: 'test' })
  }
</script>
```

Very similar patterns.

## Callback Props vs Events

There are two ways to communicate from child to parent:

**Events (dispatch):**

```svelte
<!-- Child -->
<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
</script>

<button onclick={() => dispatch('save', data)}>Save</button>

<!-- Parent -->
<Child onsave={handleSave} />
```

**Callback props:**

```svelte
<!-- Child -->
<script>
  export let onSave
</script>

<button onclick={() => onSave(data)}>Save</button>

<!-- Parent -->
<Child onSave={handleSave} />
```

Both work. Callback props are simpler and more direct. Events match the DOM mental model. Use whichever feels right for your case.

## Practical Example: Search Input

```svelte
<!-- SearchInput.svelte -->
<script>
  import { createEventDispatcher } from 'svelte'

  export let value = ''
  export let placeholder = 'Search...'
  export let debounceMs = 300

  const dispatch = createEventDispatcher()

  let timeout

  function handleInput(event) {
    value = event.target.value

    clearTimeout(timeout)
    timeout = setTimeout(() => {
      dispatch('search', value)
    }, debounceMs)
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      clearTimeout(timeout)
      dispatch('search', value)
    }
    if (event.key === 'Escape') {
      value = ''
      dispatch('clear')
    }
  }

  function handleClear() {
    value = ''
    dispatch('clear')
  }
</script>

<div class="search-wrapper">
  <input
    type="text"
    {value}
    {placeholder}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if value}
    <button
      class="clear-btn"
      onclick={handleClear}
      aria-label="Clear search"
    >
      ×
    </button>
  {/if}
</div>

<style>
  .search-wrapper {
    position: relative;
    display: inline-block;
  }

  input {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .clear-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #999;
  }
</style>
```

Usage:

```svelte
<script>
  import SearchInput from './SearchInput.svelte'

  let results = []

  async function handleSearch(event) {
    const query = event.detail
    results = await fetchResults(query)
  }

  function handleClear() {
    results = []
  }
</script>

<SearchInput
  placeholder="Search products..."
  onsearch={handleSearch}
  onclear={handleClear}
/>

<ul>
  {#each results as result}
    <li>{result.name}</li>
  {/each}
</ul>
```

## Key Takeaways

- DOM events use `oneventname={handler}` syntax
- Use modifiers like `|preventDefault` for common patterns
- Create custom events with `createEventDispatcher()`
- Event data is accessible via `event.detail`
- Forward events with bare `onclick` (no handler)
- Both callback props and events work for child-parent communication

Next: [Lesson 6: Conditional Rendering](/articles/06-conditional-rendering)
