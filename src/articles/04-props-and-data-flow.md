---
title: "Props and Data Flow"
description: "Learn how to pass data between Svelte components using props. Understand the export keyword, default values, and one-way data flow."
tags: ["svelte", "props", "components"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 5
---

## Lesson 4: Props and Data Flow

Components become powerful when they can receive data from their parents. In Svelte 5, props are declared using the `$props` rune.

## Declaring Props

Use `$props()` to declare what data your component accepts:

```svelte
<!-- Greeting.svelte -->
<script>
  let { name } = $props()
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

The `$props()` rune returns an object with all props passed to the component. You destructure the ones you need.

## Default Values

Props can have default values using JavaScript destructuring defaults:

```svelte
<script>
  let { name = 'stranger', count = 0, active = false } = $props()
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
  let {
    title,
    description = '',
    image = null,
    featured = false
  } = $props()
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

Use TypeScript for type-safe props:

```svelte
<script lang="ts">
  let {
    name,
    count = 0,
    items = []
  }: {
    name: string
    count?: number
    items?: string[]
  } = $props()
</script>
```

Or use an interface for cleaner code:

```svelte
<script lang="ts">
  interface Props {
    name: string
    count?: number
    items?: string[]
  }

  let { name, count = 0, items = [] }: Props = $props()
</script>
```

TypeScript gives you compile-time safety and editor autocompletion.

## One-Way Data Flow

Data flows down from parent to child. When the parent's data changes, the child updates. But the child shouldn't modify props directly.

Instead, use callback props to tell the parent to update:

```svelte
<!-- Counter.svelte -->
<script>
  let { count, onIncrement } = $props()
</script>

<button onclick={onIncrement}>
  Count: {count}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Counter from './Counter.svelte'

  let count = $state(0)

  function handleIncrement() {
    count++
  }
</script>

<Counter {count} onIncrement={handleIncrement} />
```

The parent owns the state, the child just calls the callback. Clean and predictable.

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

**Svelte 5:**

```svelte
<script>
  let { name, count = 0 } = $props()
</script>
```

Both use destructuring. Vue's `defineProps` and Svelte's `$props()` serve the same purpose — declaring what the component accepts.

## Rest Props

Use JavaScript's rest syntax to capture additional props:

```svelte
<script>
  let { name, age, ...rest } = $props()
</script>

<!-- Pass all other props to a child element -->
<input {...rest} />
```

This is useful for wrapper components:

```svelte
<!-- MyInput.svelte -->
<script>
  let { label, ...rest } = $props()
</script>

<label>
  {label}
  <input {...rest} />
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

Props in Svelte 5 are readonly by default. If you try to reassign a prop, you'll get an error. This enforces good data flow practices — if you need to change something, call a callback prop to tell the parent.

## Practical Example

Here's a more complete example showing props in action:

```svelte
<!-- ProductCard.svelte -->
<script>
  let {
    product,
    showDescription = true,
    onSale = false,
    onAddToCart
  } = $props()

  let displayPrice = $derived(
    onSale ? product.price * 0.8 : product.price
  )
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

  <button onclick={() => onAddToCart(product)}>
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

  let products = $state([
    { id: 1, name: 'Widget', price: 29.99, image: '/widget.jpg' },
    { id: 2, name: 'Gadget', price: 49.99, image: '/gadget.jpg' }
  ])

  let cart = $state([])

  function addToCart(product) {
    cart.push(product)
  }
</script>

<div class="grid">
  {#each products as product}
    <ProductCard
      {product}
      onSale={product.id === 1}
      onAddToCart={addToCart}
    />
  {/each}
</div>
```

## Key Takeaways

- Use `let { prop } = $props()` to declare props
- Default values use JavaScript destructuring: `let { name = 'default' } = $props()`
- Use shorthand `{propName}` when variable matches prop name
- Spread objects with `{...obj}` to pass multiple props
- Data flows one way: parent to child
- Use rest syntax `...rest` to capture additional props
- Props are readonly — use callback props to communicate upward

Next: [Lesson 5: Event Handling](/articles/05-event-handling)
