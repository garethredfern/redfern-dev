---
title: "Svelte 5 Runes: A Complete Guide for Vue Developers"
description: "A comprehensive guide to Svelte 5's runes system. Learn $state, $derived, $effect, $props, and $bindable with side-by-side Vue comparisons."
tags: ["svelte", "vue", "reactivity"]
pubDate: "2025-12-15T09:00:00Z"
---

## Svelte 5 Runes: A Complete Guide for Vue Developers

Svelte 5 introduced "runes" — a new way to handle reactivity that's both more explicit and more powerful than Svelte 4's magic `$:` syntax. If you're coming from Vue, you'll find the concepts surprisingly familiar.

This guide covers every rune in Svelte 5, with direct comparisons to Vue 3's Composition API. By the end, you'll understand not just what each rune does, but when and why to use it.

## What Are Runes?

Runes are special symbols that start with `$` and tell the Svelte compiler how to handle reactivity. They're not runtime functions — they're compile-time instructions that Svelte transforms into efficient JavaScript.

Think of them as Svelte's answer to Vue's `ref()`, `computed()`, and `watch()`. The key difference: runes look like plain JavaScript variables, but the compiler makes them reactive.

```svelte
<script>
  // This looks like a normal variable...
  let count = $state(0)

  // ...but Svelte compiles it into reactive code
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

## $state — Reactive State

The foundation of Svelte 5 reactivity. `$state` creates a reactive variable that triggers UI updates when changed.

### Svelte 5

```svelte
<script>
  let count = $state(0)
  let user = $state({ name: 'Alice', age: 30 })
  let items = $state(['apple', 'banana'])
</script>
```

### Vue 3

```vue
<script setup>
import { ref, reactive } from "vue";

const count = ref(0);
const user = reactive({ name: "Alice", age: 30 });
const items = ref(["apple", "banana"]);
</script>
```

### Key Differences

| Aspect | Svelte 5 | Vue 3 |
|--------|----------|-------|
| Syntax | `let x = $state(0)` | `const x = ref(0)` |
| Access | `count` directly | `count.value` |
| Deep reactivity | Automatic | `ref` is shallow, `reactive` is deep |
| Reassignment | Just reassign | Need `.value` for refs |

**The big win for Svelte:** No `.value` everywhere. In Vue, you constantly write `count.value++`. In Svelte, it's just `count++`.

### Deep Reactivity

Both frameworks handle nested objects, but Svelte's approach is simpler:

```svelte
<script>
  let user = $state({
    name: 'Alice',
    address: { city: 'London' }
  })

  // This triggers updates automatically
  user.address.city = 'Paris'
</script>
```

In Vue, you'd need `reactive()` for automatic deep reactivity, or manually trigger updates with `ref()`:

```vue
<script setup>
import { reactive } from "vue";

const user = reactive({
  name: "Alice",
  address: { city: "London" },
});

// Works because reactive() is deep
user.address.city = "Paris";
</script>
```

## $derived — Computed Values

When you need a value that depends on other reactive values, use `$derived`. It's Svelte's equivalent to Vue's `computed()`.

### Svelte 5

```svelte
<script>
  let firstName = $state('John')
  let lastName = $state('Doe')

  let fullName = $derived(`${firstName} ${lastName}`)
  let nameLength = $derived(fullName.length)
</script>
```

### Vue 3

```vue
<script setup>
import { ref, computed } from "vue";

const firstName = ref("John");
const lastName = ref("Doe");

const fullName = computed(() => `${firstName.value} ${lastName.value}`);
const nameLength = computed(() => fullName.value.length);
</script>
```

### $derived.by — Complex Derivations

For multi-line computations, use `$derived.by()`:

```svelte
<script>
  let items = $state([
    { name: 'Apple', price: 1.50, quantity: 3 },
    { name: 'Banana', price: 0.75, quantity: 5 }
  ])

  let cartSummary = $derived.by(() => {
    const total = items.reduce((sum, item) =>
      sum + item.price * item.quantity, 0
    )
    const itemCount = items.reduce((sum, item) =>
      sum + item.quantity, 0
    )
    return { total, itemCount }
  })
</script>

<p>Items: {cartSummary.itemCount}</p>
<p>Total: ${cartSummary.total.toFixed(2)}</p>
```

Vue's `computed()` already handles multi-line functions naturally:

```vue
<script setup>
const cartSummary = computed(() => {
  const total = items.value.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = items.value.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
});
</script>
```

### When to Use $derived vs $state

- Use `$state` for values you set directly
- Use `$derived` for values calculated from other state

```svelte
<script>
  // $state: you set these
  let price = $state(10)
  let quantity = $state(2)
  let taxRate = $state(0.2)

  // $derived: calculated from state
  let subtotal = $derived(price * quantity)
  let tax = $derived(subtotal * taxRate)
  let total = $derived(subtotal + tax)
</script>
```

## $effect — Side Effects

`$effect` runs code when reactive dependencies change. It's the combination of Vue's `watch()` and lifecycle hooks.

### Svelte 5

```svelte
<script>
  let count = $state(0)

  $effect(() => {
    console.log(`Count changed to ${count}`)
  })
</script>
```

### Vue 3

```vue
<script setup>
import { ref, watch } from "vue";

const count = ref(0);

watch(count, (newValue) => {
  console.log(`Count changed to ${newValue}`);
});
</script>
```

### Automatic Dependency Tracking

One of Svelte's best features: `$effect` automatically tracks what you read inside it.

```svelte
<script>
  let firstName = $state('John')
  let lastName = $state('Doe')
  let showFullName = $state(true)

  $effect(() => {
    // Only re-runs when dependencies actually used change
    if (showFullName) {
      console.log(`Full name: ${firstName} ${lastName}`)
    } else {
      console.log(`First name: ${firstName}`)
    }
  })
</script>
```

Vue requires explicit dependency declaration or uses `watchEffect` for automatic tracking:

```vue
<script setup>
import { watchEffect } from "vue";

// watchEffect automatically tracks dependencies (like $effect)
watchEffect(() => {
  if (showFullName.value) {
    console.log(`Full name: ${firstName.value} ${lastName.value}`);
  } else {
    console.log(`First name: ${firstName.value}`);
  }
});
</script>
```

### Cleanup Functions

Return a function from `$effect` to clean up when the component unmounts or before the effect re-runs:

```svelte
<script>
  let enabled = $state(true)

  $effect(() => {
    if (enabled) {
      const interval = setInterval(() => {
        console.log('tick')
      }, 1000)

      // Cleanup when effect re-runs or component unmounts
      return () => clearInterval(interval)
    }
  })
</script>
```

Vue uses `onUnmounted` or the `watchEffect` cleanup pattern:

```vue
<script setup>
import { watchEffect, onUnmounted } from "vue";

let interval;

watchEffect((onCleanup) => {
  if (enabled.value) {
    interval = setInterval(() => console.log("tick"), 1000);

    onCleanup(() => clearInterval(interval));
  }
});
</script>
```

### $effect vs onMount

In Svelte 4, you'd use `onMount` for setup code. In Svelte 5, `$effect` often replaces it:

```svelte
<script>
  // Svelte 4
  import { onMount } from 'svelte'
  onMount(() => {
    console.log('Component mounted')
    return () => console.log('Cleanup')
  })

  // Svelte 5 — $effect handles both mounting and reactivity
  $effect(() => {
    console.log('Component mounted')
    return () => console.log('Cleanup')
  })
</script>
```

**Important:** `$effect` only runs in the browser, not during SSR. This makes it safe for DOM APIs and browser-only code.

### $effect.pre — Before DOM Updates

Need to run code before the DOM updates? Use `$effect.pre`:

```svelte
<script>
  let messages = $state([])
  let container

  $effect.pre(() => {
    // Check scroll position BEFORE DOM updates
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight
      // Store for later use
    }
  })

  $effect(() => {
    // Runs AFTER DOM updates
    // Scroll to bottom if we were at bottom before
  })
</script>
```

## $props — Component Props

`$props` declares what data a component accepts from its parent. It replaces Svelte 4's `export let` syntax.

### Svelte 5

```svelte
<!-- Button.svelte -->
<script>
  let {
    label,
    variant = 'primary',
    disabled = false,
    onclick
  } = $props()
</script>

<button
  class={variant}
  {disabled}
  {onclick}
>
  {label}
</button>
```

### Vue 3

```vue
<!-- Button.vue -->
<script setup>
const props = defineProps({
  label: String,
  variant: { type: String, default: "primary" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["click"]);
</script>

<template>
  <button :class="variant" :disabled="disabled" @click="emit('click')">
    {{ label }}
  </button>
</template>
```

### TypeScript Support

Both frameworks have excellent TypeScript support:

```svelte
<script lang="ts">
  interface Props {
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
    onclick?: () => void
  }

  let {
    label,
    variant = 'primary',
    disabled = false,
    onclick
  }: Props = $props()
</script>
```

```vue
<script setup lang="ts">
interface Props {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false,
});

const emit = defineEmits<{
  click: [];
}>();
</script>
```

### Rest Props

Capture additional props and spread them to elements:

```svelte
<script>
  let { label, ...rest } = $props()
</script>

<input {label} {...rest} />
```

This is similar to Vue's `v-bind="$attrs"` or explicitly using `useAttrs()`.

## $bindable — Two-Way Binding

For props that should sync bidirectionally between parent and child, use `$bindable`.

### Svelte 5

```svelte
<!-- Toggle.svelte -->
<script>
  let { checked = $bindable(false) } = $props()
</script>

<input type="checkbox" bind:checked />
<span>{checked ? 'On' : 'Off'}</span>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Toggle from './Toggle.svelte'
  let isEnabled = $state(false)
</script>

<Toggle bind:checked={isEnabled} />
<p>Enabled: {isEnabled}</p>
```

### Vue 3

```vue
<!-- Toggle.vue -->
<script setup>
const checked = defineModel({ default: false });
</script>

<template>
  <input type="checkbox" v-model="checked" />
  <span>{{ checked ? "On" : "Off" }}</span>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import Toggle from "./Toggle.vue";
import { ref } from "vue";

const isEnabled = ref(false);
</script>

<template>
  <Toggle v-model="isEnabled" />
  <p>Enabled: {{ isEnabled }}</p>
</template>
```

Vue's `defineModel` (Vue 3.4+) and Svelte's `$bindable` serve the same purpose — they're both syntactic sugar for the "prop down, event up" pattern.

## Complete Comparison Table

| Concept | Vue 3 | Svelte 5 |
|---------|-------|----------|
| Reactive primitive | `ref(0)` | `$state(0)` |
| Reactive object | `reactive({})` | `$state({})` |
| Computed value | `computed(() => ...)` | `$derived(...)` |
| Complex computed | `computed(() => { ... })` | `$derived.by(() => { ... })` |
| Watch/Effect | `watch()` / `watchEffect()` | `$effect()` |
| Pre-update effect | `onBeforeUpdate()` | `$effect.pre()` |
| Props | `defineProps()` | `$props()` |
| Two-way binding | `defineModel()` | `$bindable()` |
| Emit events | `defineEmits()` | Callback props |
| Access value | `.value` for refs | Direct access |

## Patterns You'll Use Daily

### Form Handling

```svelte
<script>
  let form = $state({
    email: '',
    password: ''
  })

  let errors = $derived.by(() => {
    const errs = {}
    if (!form.email.includes('@')) errs.email = 'Invalid email'
    if (form.password.length < 8) errs.password = 'Too short'
    return errs
  })

  let isValid = $derived(Object.keys(errors).length === 0)

  function handleSubmit() {
    if (isValid) {
      console.log('Submitting:', form)
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <input bind:value={form.email} placeholder="Email" />
  {#if errors.email}<span class="error">{errors.email}</span>{/if}

  <input bind:value={form.password} type="password" placeholder="Password" />
  {#if errors.password}<span class="error">{errors.password}</span>{/if}

  <button disabled={!isValid}>Submit</button>
</form>
```

### Data Fetching

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
      .then(res => res.json())
      .then(data => user = data)
      .catch(err => error = err.message)
      .finally(() => loading = false)
  })
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  <h1>{user.name}</h1>
{/if}
```

### Event Listeners

```svelte
<script>
  let windowWidth = $state(0)

  $effect(() => {
    const handleResize = () => {
      windowWidth = window.innerWidth
    }

    handleResize() // Initial value
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  })
</script>

<p>Window width: {windowWidth}px</p>
```

## Why Svelte's Approach Works

Coming from Vue, you might wonder: is this actually better?

**Pros of Svelte's runes:**

1. **No `.value`** — Less typing, fewer bugs from forgetting it
2. **Unified model** — `$state` works the same for primitives and objects
3. **Explicit reactivity** — Easy to see what's reactive at a glance
4. **Natural JavaScript** — Reads like plain JS with magic sprinkled in
5. **Compiler optimizations** — Zero runtime overhead for reactivity

**Pros of Vue's approach:**

1. **More explicit dependencies** — `watch()` makes dependencies obvious
2. **Better debugging** — Devtools can inspect refs directly
3. **Ecosystem maturity** — More libraries, more examples
4. **Flexibility** — `ref` vs `reactive` gives you control

Both approaches are valid. Svelte optimizes for developer experience and bundle size. Vue optimizes for flexibility and debugging. Your choice depends on what you value most.

## Making the Switch

If you're a Vue developer trying Svelte, here's a mental model:

1. **`ref()` → `$state()`** — Same idea, no `.value`
2. **`computed()` → `$derived()`** — Same idea, just different syntax
3. **`watch()` → `$effect()`** — But with automatic dependency tracking
4. **`defineProps()` → `$props()`** — Destructure instead of define
5. **`v-model` → `bind:` + `$bindable`** — Same two-way binding concept

The biggest adjustment isn't the syntax — it's trusting the compiler. In Vue, you explicitly tell it what's reactive. In Svelte, the compiler figures it out from your `$` runes. Once you trust it, the code feels remarkably clean.

---

_Try converting one of your Vue components to Svelte. The comparison will teach you both frameworks better than any tutorial._
