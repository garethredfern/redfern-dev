---
title: "Reactivity Basics"
description: "Master Svelte's reactive system. Learn how reactive declarations, statements, and the $: syntax make state management effortless."
tags: ["svelte", "reactivity", "fundamentals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 4
---

## Lesson 3: Reactivity Basics

Reactivity is Svelte's superpower. When your data changes, your UI updates automatically. Svelte 5 introduced "runes" — special compiler instructions that make reactivity explicit and powerful.

## Reactive State with $state

In React, you need `useState`. In Vue, you need `ref()`. In Svelte 5, you use `$state`:

```svelte
<script>
  let count = $state(0)
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

The `$state` rune tells Svelte this variable is reactive. When `count` changes, the button text updates automatically.

This works because Svelte is a compiler. It sees `$state` and generates the exact JavaScript needed to update the DOM when the value changes.

## Deep Reactivity with $state

Unlike some frameworks, `$state` provides deep reactivity. Arrays and objects are reactive at all levels:

```svelte
<script>
  let numbers = $state([1, 2, 3])
  let user = $state({ name: 'Alice', age: 30 })
</script>

<button onclick={() => numbers.push(4)}>
  Add number (length: {numbers.length})
</button>

<button onclick={() => user.age++}>
  Age: {user.age}
</button>
```

Both `numbers.push(4)` and `user.age++` trigger UI updates automatically. No need to reassign or spread — Svelte tracks nested changes.

This is a major improvement over Svelte 4, where you needed to reassign arrays and objects after mutation.

## Derived Values with $derived

What if you have a value that depends on other values? Like a fullName that combines firstName and lastName?

Use `$derived`:

```svelte
<script>
  let firstName = $state('Gareth')
  let lastName = $state('Redfern')

  let fullName = $derived(`${firstName} ${lastName}`)
</script>

<p>Hello, {fullName}</p>

<input bind:value={firstName} />
<input bind:value={lastName} />
```

Whenever `firstName` or `lastName` changes, `fullName` automatically updates. Svelte figures out the dependencies for you.

You can do calculations:

```svelte
<script>
  let width = $state(10)
  let height = $state(5)

  let area = $derived(width * height)
  let perimeter = $derived(2 * (width + height))
</script>
```

Or derive from arrays:

```svelte
<script>
  let items = $state([
    { name: 'Apples', price: 1.50 },
    { name: 'Bananas', price: 0.75 },
    { name: 'Oranges', price: 2.00 }
  ])

  let total = $derived(items.reduce((sum, item) => sum + item.price, 0))
</script>
```

## Side Effects with $effect

For code that should run when state changes (side effects), use `$effect`:

```svelte
<script>
  let count = $state(0)

  $effect(() => {
    console.log(`count is now ${count}`)
  })

  $effect(() => {
    if (count > 10) {
      alert('Count is getting high!')
      count = 0
    }
  })
</script>
```

Effects run after the component mounts and whenever their dependencies change. They're perfect for:

- Logging
- Updating document.title
- Syncing with external systems
- Setting up subscriptions

```svelte
<script>
  let name = $state('')

  $effect(() => {
    console.log(`Name changed to: ${name}`)
    document.title = `Hello, ${name}`
  })
</script>
```

**Important:** `$effect` only runs in the browser, not during server-side rendering. This makes it safe for browser-only APIs.

## Comparing to Vue

If you're coming from Vue, here's how the concepts map:

**Vue ref + computed:**

```javascript
const firstName = ref("Gareth");
const lastName = ref("Redfern");
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
```

**Svelte 5 equivalent:**

```svelte
let firstName = $state('Gareth')
let lastName = $state('Redfern')
let fullName = $derived(`${firstName} ${lastName}`)
```

**Vue watch:**

```javascript
watch(count, (newValue) => {
  console.log(`count is now ${newValue}`);
});
```

**Svelte 5 equivalent:**

```svelte
$effect(() => {
  console.log(`count is now ${count}`)
})
```

The mental model is nearly identical. Vue uses `ref()` and `computed()`, Svelte uses `$state` and `$derived`. Both have explicit reactivity.

## Common Patterns

**Filtered lists:**

```svelte
<script>
  let items = $state(['Apple', 'Banana', 'Cherry', 'Date'])
  let search = $state('')

  let filtered = $derived(
    items.filter(item =>
      item.toLowerCase().includes(search.toLowerCase())
    )
  )
</script>

<input bind:value={search} placeholder="Search..." />

<ul>
  {#each filtered as item}
    <li>{item}</li>
  {/each}
</ul>
```

**Fetching data when dependencies change:**

```svelte
<script>
  let userId = $state(1)
  let user = $state(null)

  $effect(() => {
    loadUser(userId)
  })

  async function loadUser(id) {
    const response = await fetch(`/api/users/${id}`)
    user = await response.json()
  }
</script>
```

**Validations:**

```svelte
<script>
  let email = $state('')
  let password = $state('')

  let emailValid = $derived(email.includes('@'))
  let passwordValid = $derived(password.length >= 8)
  let formValid = $derived(emailValid && passwordValid)
</script>

<button disabled={!formValid}>Submit</button>
```

## Debugging Reactivity

When things aren't updating as expected, check:

1. **Did you use `$state`?** Regular `let` variables aren't reactive in Svelte 5.
2. **Is the variable used in the template?** Svelte only tracks state that appears in your markup or effects.
3. **Are you reading the value?** `$derived` and `$effect` track what you actually read inside them.

You can add an effect to debug:

```svelte
$effect(() => {
  console.log({ count, items, user })
})
```

## The Runes at a Glance

| Rune | Purpose | Example |
|------|---------|---------|
| `$state` | Reactive state | `let count = $state(0)` |
| `$derived` | Computed values | `let double = $derived(count * 2)` |
| `$effect` | Side effects | `$effect(() => console.log(count))` |

## Key Takeaways

- Use `$state()` to create reactive variables
- Use `$derived()` for values computed from other state
- Use `$effect()` for side effects when state changes
- `$state` provides deep reactivity for arrays and objects
- Effects only run in the browser, not during SSR
- Runes make reactivity explicit — no magic `$:` syntax

Next: [Lesson 4: Props and Data Flow](/articles/04-props-and-data-flow)
