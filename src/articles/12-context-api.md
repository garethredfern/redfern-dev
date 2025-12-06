---
title: "Context API"
description: "Share data through component trees without prop drilling. Learn setContext, getContext, and when to use context vs stores."
tags: ["svelte", "context", "state-management"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 13
---

# Lesson 12: Context API

Props pass data explicitly. Stores share data globally. Context sits between — sharing data through a component tree without drilling props through every level.

## The Problem Context Solves

Imagine a form with nested components:

```
Form
  └── FieldGroup
        └── Field
              └── Input
                    └── ErrorMessage
```

If `Form` manages validation state, you'd need to pass it through every component. Tedious and fragile.

Context lets `Form` provide data that any descendant can access directly.

## Setting Context

Use `setContext` in a parent component:

```svelte
<!-- Form.svelte -->
<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  const errors = writable({})
  const values = writable({})

  setContext('form', {
    errors,
    values,
    register: (name, validators) => { /* ... */ },
    validate: () => { /* ... */ }
  })
</script>

<form>
  <slot />
</form>
```

`setContext` takes a key (any value, often a string or symbol) and a value to share.

## Getting Context

Use `getContext` in any descendant:

```svelte
<!-- ErrorMessage.svelte -->
<script>
  import { getContext } from 'svelte'

  export let name

  const { errors } = getContext('form')

  $: error = $errors[name]
</script>

{#if error}
  <span class="error">{error}</span>
{/if}
```

The child doesn't need to know how many levels up `Form` is.

## Context Keys

String keys work but can collide. For library code, use symbols:

```javascript
// context-keys.js
export const FORM_KEY = Symbol("form");
export const THEME_KEY = Symbol("theme");
```

```svelte
<script>
  import { setContext } from 'svelte'
  import { FORM_KEY } from './context-keys.js'

  setContext(FORM_KEY, { /* ... */ })
</script>
```

Symbols guarantee uniqueness.

## Context vs Stores

When to use which?

**Use stores when:**

- State is truly global (theme, auth, cart)
- Unrelated components need the same data
- State should persist across navigation

**Use context when:**

- State is scoped to a component tree
- Multiple instances might exist (multiple forms on a page)
- You're building a component library

A form's validation state shouldn't be global. Multiple forms could exist. Use context.

User authentication affects the whole app. Use a store.

## Context with Stores

The best pattern: put stores in context.

```svelte
<!-- Tabs.svelte -->
<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  export let initial = 0

  const activeTab = writable(initial)

  setContext('tabs', {
    activeTab,
    registerTab: () => { /* ... */ }
  })
</script>

<div class="tabs">
  <slot />
</div>
```

```svelte
<!-- Tab.svelte -->
<script>
  import { getContext } from 'svelte'

  export let id

  const { activeTab } = getContext('tabs')

  $: isActive = $activeTab === id
</script>

<button
  class:active={isActive}
  onclick={() => $activeTab = id}
>
  <slot />
</button>
```

The store inside context gets reactivity. The context scopes it to this tab group.

## hasContext

Check if context exists:

```svelte
<script>
  import { hasContext, getContext } from 'svelte'

  const hasForm = hasContext('form')

  // Only try to get context if it exists
  const form = hasForm ? getContext('form') : null
</script>
```

Useful for optional integration with parent components.

## Comparing to Vue

Vue's provide/inject:

```vue
<!-- Parent.vue -->
<script setup>
import { provide, ref } from "vue";

const theme = ref("light");
provide("theme", theme);
</script>

<!-- Child.vue -->
<script setup>
import { inject } from "vue";

const theme = inject("theme");
</script>
```

Svelte:

```svelte
<!-- Parent.svelte -->
<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  const theme = writable('light')
  setContext('theme', theme)
</script>

<!-- Child.svelte -->
<script>
  import { getContext } from 'svelte'

  const theme = getContext('theme')
</script>

<p>Theme: {$theme}</p>
```

Similar concepts. Vue's `ref` is reactive by default. Svelte needs a store for reactivity in context.

## Practical Example: Toast System

```svelte
<!-- ToastProvider.svelte -->
<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  const toasts = writable([])

  let id = 0

  function addToast(message, type = 'info', duration = 3000) {
    const toast = { id: id++, message, type }
    toasts.update(t => [...t, toast])

    setTimeout(() => {
      removeToast(toast.id)
    }, duration)
  }

  function removeToast(id) {
    toasts.update(t => t.filter(toast => toast.id !== id))
  }

  setContext('toasts', {
    add: addToast,
    remove: removeToast,
    toasts
  })
</script>

<slot />

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast {toast.type}">
      <p>{toast.message}</p>
      <button onclick={() => removeToast(toast.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toast {
    padding: 1rem;
    border-radius: 4px;
    background: #333;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 200px;
  }

  .toast.success { background: #16a34a; }
  .toast.error { background: #dc2626; }
  .toast.warning { background: #d97706; }
</style>
```

Usage anywhere in the app:

```svelte
<script>
  import { getContext } from 'svelte'

  const { add: addToast } = getContext('toasts')

  async function handleSubmit() {
    try {
      await saveData()
      addToast('Saved successfully!', 'success')
    } catch (e) {
      addToast('Failed to save', 'error')
    }
  }
</script>
```

## Practical Example: Form Validation

```svelte
<!-- FormProvider.svelte -->
<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  const values = writable({})
  const errors = writable({})
  const touched = writable({})

  const validators = {}

  function register(name, validate = () => null) {
    validators[name] = validate
    values.update(v => ({ ...v, [name]: '' }))
  }

  function setValue(name, value) {
    values.update(v => ({ ...v, [name]: value }))
    touched.update(t => ({ ...t, [name]: true }))
    validateField(name, value)
  }

  function validateField(name, value) {
    const error = validators[name]?.(value)
    errors.update(e => ({ ...e, [name]: error }))
    return !error
  }

  function validateAll() {
    let valid = true
    const currentValues = {}
    values.subscribe(v => Object.assign(currentValues, v))()

    for (const [name, value] of Object.entries(currentValues)) {
      if (!validateField(name, value)) {
        valid = false
      }
    }

    return valid
  }

  setContext('form', {
    values,
    errors,
    touched,
    register,
    setValue,
    validateAll
  })
</script>

<slot />
```

```svelte
<!-- FormField.svelte -->
<script>
  import { getContext, onMount } from 'svelte'

  export let name
  export let label = name
  export let type = 'text'
  export let required = false

  const { values, errors, touched, register, setValue } = getContext('form')

  onMount(() => {
    register(name, (value) => {
      if (required && !value) return `${label} is required`
      return null
    })
  })

  $: value = $values[name] || ''
  $: error = $errors[name]
  $: showError = $touched[name] && error
</script>

<div class="field">
  <label for={name}>{label}</label>
  <input
    {type}
    id={name}
    {value}
    oninput={(e) => setValue(name, e.target.value)}
  />
  {#if showError}
    <span class="error">{error}</span>
  {/if}
</div>
```

## Key Takeaways

- `setContext(key, value)` shares data with descendants
- `getContext(key)` retrieves that data
- Use symbols for keys in libraries to avoid collisions
- Put stores in context for reactivity
- Context is scoped; stores are global
- Use `hasContext` to check before getting
- Perfect for component libraries (tabs, forms, modals)

Next: [Lesson 13: Introduction to SvelteKit](/articles/13-introduction-to-sveltekit)
