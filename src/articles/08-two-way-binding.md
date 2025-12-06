---
title: "Two-Way Binding"
description: "Master Svelte's bind directive for seamless form handling. Learn to bind inputs, selects, checkboxes, and component props."
tags: ["svelte", "forms", "binding"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 9
---

# Lesson 8: Two-Way Binding

In Lesson 4, we learned that data flows one way: parent to child. But forms need something more — when a user types in an input, you want your state to update. Svelte's `bind:` directive makes this effortless.

## Binding Text Inputs

Without binding:

```svelte
<script>
  let name = ''

  function handleInput(event) {
    name = event.target.value
  }
</script>

<input value={name} oninput={handleInput} />
```

With binding:

```svelte
<script>
  let name = ''
</script>

<input bind:value={name} />
```

One line instead of five. The input's value and your variable stay in sync automatically.

## How Binding Works

`bind:value={name}` does two things:

1. Sets the input's value from `name`
2. Updates `name` when the input changes

It's syntactic sugar for the manual approach, but much cleaner.

## Different Input Types

**Text inputs:**

```svelte
<input type="text" bind:value={name} />
<input type="email" bind:value={email} />
<input type="password" bind:value={password} />
<textarea bind:value={message} />
```

**Number inputs:**

```svelte
<script>
  let quantity = 1
</script>

<input type="number" bind:value={quantity} />
<input type="range" bind:value={quantity} min="0" max="10" />
```

Note: `bind:value` on number inputs gives you a number, not a string. Svelte handles the conversion.

**Checkboxes:**

```svelte
<script>
  let accepted = false
</script>

<input type="checkbox" bind:checked={accepted} />
<label>I accept the terms</label>
```

For checkboxes, bind to `checked`, not `value`.

**Checkbox groups:**

```svelte
<script>
  let flavors = []
</script>

<label>
  <input type="checkbox" bind:group={flavors} value="vanilla" />
  Vanilla
</label>
<label>
  <input type="checkbox" bind:group={flavors} value="chocolate" />
  Chocolate
</label>
<label>
  <input type="checkbox" bind:group={flavors} value="strawberry" />
  Strawberry
</label>

<p>Selected: {flavors.join(', ')}</p>
```

`bind:group` collects checked values into an array.

**Radio buttons:**

```svelte
<script>
  let size = 'medium'
</script>

<label>
  <input type="radio" bind:group={size} value="small" />
  Small
</label>
<label>
  <input type="radio" bind:group={size} value="medium" />
  Medium
</label>
<label>
  <input type="radio" bind:group={size} value="large" />
  Large
</label>

<p>Selected: {size}</p>
```

Radio buttons use `bind:group` too, but only one value is selected.

## Select Elements

**Single select:**

```svelte
<script>
  let selected = ''

  let options = [
    { value: 'uk', label: 'United Kingdom' },
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' }
  ]
</script>

<select bind:value={selected}>
  <option value="">Choose a country</option>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
```

**Multiple select:**

```svelte
<script>
  let selectedCountries = []
</script>

<select multiple bind:value={selectedCountries}>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
```

With `multiple`, the bound value is an array.

## Binding to Objects

You can bind options to objects directly:

```svelte
<script>
  let products = [
    { id: 1, name: 'Widget', price: 25 },
    { id: 2, name: 'Gadget', price: 50 }
  ]

  let selected = null
</script>

<select bind:value={selected}>
  <option value={null}>Choose a product</option>
  {#each products as product}
    <option value={product}>{product.name}</option>
  {/each}
</select>

{#if selected}
  <p>Price: £{selected.price}</p>
{/if}
```

The entire object becomes the bound value, not just an ID.

## Contenteditable

You can bind to contenteditable elements:

```svelte
<script>
  let html = '<p>Edit <strong>me</strong>!</p>'
</script>

<div contenteditable="true" bind:innerHTML={html}></div>
```

Use `bind:innerHTML` or `bind:textContent`.

## Other Bindings

Svelte can bind to other DOM properties:

```svelte
<!-- Element dimensions (read-only) -->
<div bind:clientWidth={width} bind:clientHeight={height}>
  Resize me
</div>

<!-- Scroll position -->
<div bind:scrollY={y}>
  Scrollable content
</div>

<!-- Media elements -->
<video
  bind:currentTime={time}
  bind:duration
  bind:paused
>
  <source src="video.mp4" />
</video>
```

## Component Binding

You can also bind to component props:

```svelte
<!-- Counter.svelte -->
<script>
  export let count = 0
</script>

<button onclick={() => count++}>
  {count}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Counter from './Counter.svelte'

  let value = 0
</script>

<Counter bind:count={value} />
<p>The count is {value}</p>
```

When the Counter updates `count`, the parent's `value` updates too.

Use this sparingly. It can make data flow confusing. Often, events are clearer.

## Comparing to Vue

Vue's v-model:

```vue
<input v-model="name" />

<!-- With modifiers -->
<input v-model.trim="name" />
<input v-model.number="age" />
<input v-model.lazy="search" />
```

Svelte's bind:

```svelte
<input bind:value={name} />
```

Svelte doesn't have built-in modifiers like `.trim` or `.lazy`. You'd handle those manually:

```svelte
<script>
  let name = ''

  function handleInput(event) {
    name = event.target.value.trim()
  }
</script>

<input value={name} oninput={handleInput} />
```

Or create a custom action (covered in advanced topics).

## Practical Example: Registration Form

```svelte
<script>
  let form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
    plan: 'free'
  }

  let errors = {}

  $: {
    errors = {}
    if (form.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    if (!form.email.includes('@')) {
      errors.email = 'Please enter a valid email'
    }
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
  }

  $: isValid = Object.keys(errors).length === 0

  function handleSubmit() {
    if (isValid) {
      console.log('Submitting:', form)
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <div class="field">
    <label for="name">Name</label>
    <input id="name" bind:value={form.name} />
    {#if errors.name}
      <span class="error">{errors.name}</span>
    {/if}
  </div>

  <div class="field">
    <label for="email">Email</label>
    <input id="email" type="email" bind:value={form.email} />
    {#if errors.email}
      <span class="error">{errors.email}</span>
    {/if}
  </div>

  <div class="field">
    <label for="password">Password</label>
    <input id="password" type="password" bind:value={form.password} />
    {#if errors.password}
      <span class="error">{errors.password}</span>
    {/if}
  </div>

  <div class="field">
    <label for="confirm">Confirm Password</label>
    <input id="confirm" type="password" bind:value={form.confirmPassword} />
    {#if errors.confirmPassword}
      <span class="error">{errors.confirmPassword}</span>
    {/if}
  </div>

  <div class="field">
    <label>
      <input type="checkbox" bind:checked={form.newsletter} />
      Subscribe to newsletter
    </label>
  </div>

  <fieldset>
    <legend>Plan</legend>
    <label>
      <input type="radio" bind:group={form.plan} value="free" />
      Free
    </label>
    <label>
      <input type="radio" bind:group={form.plan} value="pro" />
      Pro (£9/month)
    </label>
    <label>
      <input type="radio" bind:group={form.plan} value="team" />
      Team (£29/month)
    </label>
  </fieldset>

  <button type="submit" disabled={!isValid}>
    Create Account
  </button>
</form>

<style>
  .field {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .error {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>
```

## Key Takeaways

- `bind:value` creates two-way binding for inputs
- `bind:checked` for checkboxes
- `bind:group` for checkbox/radio groups
- Number inputs automatically convert to numbers
- Select elements can bind to objects, not just strings
- You can bind to component props (use sparingly)
- No built-in modifiers — handle trimming/debouncing manually

Next: [Lesson 9: Slots and Composition](/articles/09-slots-and-composition)
