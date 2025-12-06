---
title: "Reactivity Basics"
description: "Master Svelte's reactive system. Learn how reactive declarations, statements, and the $: syntax make state management effortless."
tags: ["svelte", "reactivity", "fundamentals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 4
---

# Lesson 3: Reactivity Basics

Reactivity is Svelte's superpower. When your data changes, your UI updates automatically. But Svelte's approach is different from other frameworks — and simpler.

## How Svelte Tracks Changes

In React, you need `useState` to make a value reactive. In Vue, you need `ref()` or `reactive()`. In Svelte, you just use `let`:

```svelte
<script>
  let count = 0
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

That's it. Svelte sees that `count` is used in the template and compiles update code for it. When `count` changes, the button text updates.

This works because Svelte is a compiler. It analyzes your code and generates the exact JavaScript needed to update the DOM when variables change.

## The Assignment Rule

Here's the key insight: **Svelte's reactivity is triggered by assignment**.

This updates the UI:

```svelte
count = count + 1
```

This also updates the UI:

```svelte
count++
```

But this does NOT update the UI:

```svelte
let numbers = [1, 2, 3]
numbers.push(4)  // UI won't update!
```

Why? Because you haven't assigned anything to `numbers`. You've mutated the array, but `numbers` still points to the same array.

The fix is to reassign:

```svelte
let numbers = [1, 2, 3]
numbers = [...numbers, 4]  // UI updates
```

Or use a shorthand:

```svelte
numbers.push(4)
numbers = numbers  // This triggers the update
```

The same applies to objects. Mutating a property won't trigger updates unless you reassign:

```svelte
let user = { name: 'Alice', age: 30 }

// Won't trigger update:
user.age = 31

// Will trigger update:
user = { ...user, age: 31 }

// Or:
user.age = 31
user = user
```

## Reactive Declarations

What if you have a value that depends on other values? Like a fullName that combines firstName and lastName?

Use `$:` (called a reactive declaration):

```svelte
<script>
  let firstName = 'Gareth'
  let lastName = 'Redfern'

  $: fullName = `${firstName} ${lastName}`
</script>

<p>Hello, {fullName}</p>

<input bind:value={firstName} />
<input bind:value={lastName} />
```

Whenever `firstName` or `lastName` changes, `fullName` automatically updates. Svelte figures out the dependencies for you.

You can do calculations:

```svelte
<script>
  let width = 10
  let height = 5

  $: area = width * height
  $: perimeter = 2 * (width + height)
</script>
```

Or derive from arrays:

```svelte
<script>
  let items = [
    { name: 'Apples', price: 1.50 },
    { name: 'Bananas', price: 0.75 },
    { name: 'Oranges', price: 2.00 }
  ]

  $: total = items.reduce((sum, item) => sum + item.price, 0)
</script>
```

## Reactive Statements

`$:` can also run entire blocks of code when dependencies change:

```svelte
<script>
  let count = 0

  $: console.log(`count is now ${count}`)

  $: if (count > 10) {
    alert('Count is getting high!')
    count = 0
  }
</script>
```

For multiple statements, use a block:

```svelte
<script>
  let name = ''

  $: {
    console.log(`Name changed to: ${name}`)
    document.title = `Hello, ${name}`
  }
</script>
```

This is useful for side effects — things that need to happen when state changes but aren't just derived values.

## Comparing to Vue

If you're coming from Vue, here's how the concepts map:

**Vue computed:**

```javascript
const firstName = ref("Gareth");
const lastName = ref("Redfern");
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
```

**Svelte equivalent:**

```svelte
let firstName = 'Gareth'
let lastName = 'Redfern'
$: fullName = `${firstName} ${lastName}`
```

**Vue watch:**

```javascript
watch(count, (newValue) => {
  console.log(`count is now ${newValue}`);
});
```

**Svelte equivalent:**

```svelte
$: console.log(`count is now ${count}`)
```

The Svelte versions are more concise, but the mental model is similar.

## Common Patterns

**Filtered lists:**

```svelte
<script>
  let items = ['Apple', 'Banana', 'Cherry', 'Date']
  let search = ''

  $: filtered = items.filter(item =>
    item.toLowerCase().includes(search.toLowerCase())
  )
</script>

<input bind:value={search} placeholder="Search..." />

<ul>
  {#each filtered as item}
    <li>{item}</li>
  {/each}
</ul>
```

**Dependent fetches (be careful with this pattern):**

```svelte
<script>
  let userId = 1
  let user = null

  $: loadUser(userId)

  async function loadUser(id) {
    const response = await fetch(`/api/users/${id}`)
    user = await response.json()
  }
</script>
```

**Validations:**

```svelte
<script>
  let email = ''
  let password = ''

  $: emailValid = email.includes('@')
  $: passwordValid = password.length >= 8
  $: formValid = emailValid && passwordValid
</script>

<button disabled={!formValid}>Submit</button>
```

## Debugging Reactivity

When things aren't updating as expected, check:

1. **Are you assigning?** Remember, mutation without assignment doesn't trigger updates.
2. **Is the variable used in the template?** Svelte only tracks variables that appear in your markup.
3. **Are dependencies clear?** `$:` tracks variables mentioned in the expression.

You can always add a reactive statement to debug:

```svelte
$: console.log({ count, items, user })
```

## Key Takeaways

- Variables declared with `let` are reactive when used in templates
- Reactivity is triggered by assignment, not mutation
- Use `$:` for derived values and reactive statements
- `$: derived = expression` creates a value that auto-updates
- `$: { code }` runs code whenever dependencies change
- Always reassign arrays and objects after mutation

Next: [Lesson 4: Props and Data Flow](/articles/04-props-and-data-flow)
