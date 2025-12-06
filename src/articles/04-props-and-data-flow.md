---
title: "Props and Data Flow"
description: "Learn how to pass data between Svelte components using props. Understand the export keyword, default values, and one-way data flow."
tags: ["svelte", "props", "components"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 5
---

# Lesson 4: Props and Data Flow

Components become powerful when they can receive data from their parents. In Svelte, this happens through props — and the syntax is delightfully simple.

## Declaring Props

To make a variable a prop, export it:

```svelte
<!-- Greeting.svelte -->
<script>
  export let name
</script>

<h1>Hello, {name}!</h1>
```

Now you can pass data to this component:

```svelte
<!-- Parent.svelte -->
<script>
  import Greeting from './Greeting.svelte'
</script>

<Greeting name="Gareth" />
<Greeting name="World" />
```

That's it. `export let` declares a prop.

## Default Values

Props can have default values:

```svelte
<script>
  export let name = 'stranger'
  export let count = 0
  export let active = false
</script>
```

If the parent doesn't provide a value, the default is used:

```svelte
<Greeting />          <!-- Shows "Hello, stranger!" -->
<Greeting name="Jo" /> <!-- Shows "Hello, Jo!" -->
```

## Multiple Props

Components often have several props:

```svelte
<!-- Card.svelte -->
<script>
  export let title
  export let description = ''
  export let image = null
  export let featured = false
</script>

<article class:featured>
  {#if image}
    <img src={image} alt={title} />
  {/if}
  <h2>{title}</h2>
  {#if description}
    <p>{description}</p>
  {/if}
</article>

<style>
  article {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
  }

  .featured {
    border-color: gold;
    background: #fffbeb;
  }
</style>
```

Using it:

```svelte
<Card
  title="Learning Svelte"
  description="A practical guide to the framework"
  featured={true}
/>

<Card title="Quick Note" />
```

## Shorthand Props

When the variable name matches the prop name, use the shorthand:

```svelte
<script>
  let name = 'Gareth'
  let age = 35
</script>

<!-- Instead of this: -->
<Profile name={name} age={age} />

<!-- Write this: -->
<Profile {name} {age} />
```

This is common and makes templates cleaner.

## Spread Props

If you have an object with all the props you need, spread it:

```svelte
<script>
  import Card from './Card.svelte'

  let cardData = {
    title: 'My Card',
    description: 'A description',
    featured: true
  }
</script>

<Card {...cardData} />
```

This passes all properties of `cardData` as individual props.

## Prop Types

Svelte doesn't have built-in prop validation like Vue or React PropTypes. But you can use TypeScript:

```svelte
<script lang="ts">
  export let name: string
  export let count: number = 0
  export let items: string[] = []
</script>
```

Or add runtime checks if needed:

```svelte
<script>
  export let count

  $: if (typeof count !== 'number') {
    console.warn('count should be a number')
  }
</script>
```

For most projects, TypeScript is the right answer.

## One-Way Data Flow

Data flows down from parent to child. When the parent's data changes, the child updates. But the child shouldn't modify props directly:

```svelte
<!-- Don't do this -->
<script>
  export let count

  function increment() {
    count++  // Modifying a prop directly
  }
</script>
```

This technically works, but it creates confusing data flow. The parent thinks it owns `count`, but the child is changing it.

Instead, emit an event to tell the parent to update:

```svelte
<!-- Counter.svelte -->
<script>
  import { createEventDispatcher } from 'svelte'

  export let count

  const dispatch = createEventDispatcher()

  function increment() {
    dispatch('increment')
  }
</script>

<button onclick={increment}>
  Count: {count}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Counter from './Counter.svelte'

  let count = 0

  function handleIncrement() {
    count++
  }
</script>

<Counter {count} on:increment={handleIncrement} />
```

We'll cover events in detail in the next lesson.

## Comparing to Vue

If you're familiar with Vue, here's how props compare:

**Vue:**

```vue
<script setup>
const props = defineProps({
  name: String,
  count: { type: Number, default: 0 },
});
</script>
```

**Svelte:**

```svelte
<script>
  export let name
  export let count = 0
</script>
```

Vue is more explicit about types (without TypeScript). Svelte is more concise.

## The `$$props` and `$$restProps`

Sometimes you need access to all props or props you haven't explicitly declared:

```svelte
<script>
  export let name
  export let age

  // $$props contains all props passed to the component
  // $$restProps contains props NOT declared with export
</script>

<!-- Pass all undeclared props to a child element -->
<input {...$$restProps} />
```

This is useful for wrapper components:

```svelte
<!-- MyInput.svelte -->
<script>
  export let label
</script>

<label>
  {label}
  <input {...$$restProps} />
</label>
```

```svelte
<!-- Usage -->
<MyInput
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>
```

The `label` prop is handled by the component. Everything else (`type`, `placeholder`, `required`) passes through to the `<input>`.

## Readonly Props

If you want to make it clear a prop shouldn't be modified, you can use `const`:

```svelte
<script>
  export const version = '1.0.0'
</script>
```

But this is rare. Usually you just don't modify props.

## Practical Example

Here's a more complete example showing props in action:

```svelte
<!-- ProductCard.svelte -->
<script>
  import { createEventDispatcher } from 'svelte'

  export let product
  export let showDescription = true
  export let onSale = false

  const dispatch = createEventDispatcher()

  $: displayPrice = onSale
    ? product.price * 0.8
    : product.price
</script>

<article class:on-sale={onSale}>
  <img src={product.image} alt={product.name} />
  <h3>{product.name}</h3>

  {#if showDescription && product.description}
    <p>{product.description}</p>
  {/if}

  <div class="price">
    {#if onSale}
      <span class="original">£{product.price.toFixed(2)}</span>
    {/if}
    <span class="current">£{displayPrice.toFixed(2)}</span>
  </div>

  <button onclick={() => dispatch('addToCart', product)}>
    Add to Cart
  </button>
</article>

<style>
  article {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
  }

  .on-sale {
    border-color: #ef4444;
  }

  .original {
    text-decoration: line-through;
    color: #999;
  }

  .current {
    font-weight: bold;
    color: #16a34a;
  }
</style>
```

```svelte
<!-- Shop.svelte -->
<script>
  import ProductCard from './ProductCard.svelte'

  let products = [
    { id: 1, name: 'Widget', price: 29.99, image: '/widget.jpg' },
    { id: 2, name: 'Gadget', price: 49.99, image: '/gadget.jpg' }
  ]

  let cart = []

  function addToCart(event) {
    cart = [...cart, event.detail]
  }
</script>

<div class="grid">
  {#each products as product}
    <ProductCard
      {product}
      onSale={product.id === 1}
      on:addToCart={addToCart}
    />
  {/each}
</div>
```

## Key Takeaways

- Use `export let` to declare a prop
- Props can have default values: `export let name = 'default'`
- Use shorthand `{propName}` when variable matches prop name
- Spread objects with `{...obj}` to pass multiple props
- Data flows one way: parent to child
- Use `$$restProps` to pass through undeclared props
- Don't mutate props directly — use events instead

Next: [Lesson 5: Event Handling](/articles/05-event-handling)
