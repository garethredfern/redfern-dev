---
title: "Lists and Iteration"
description: "Render lists efficiently with Svelte's each blocks. Learn about keyed iteration, destructuring, and handling empty states."
tags: ["svelte", "templates", "lists"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 8
---

## Lesson 7: Lists and Iteration

Most apps need to render lists — products, users, comments, todo items. Svelte's `{#each}` block makes this straightforward and performant.

## Basic Each Blocks

```svelte
<script>
  let fruits = ['Apple', 'Banana', 'Cherry']
</script>

<ul>
  {#each fruits as fruit}
    <li>{fruit}</li>
  {/each}
</ul>
```

The syntax: `{#each array as item}`.

## Accessing the Index

Need the position in the list? Add a second variable:

```svelte
{#each fruits as fruit, index}
  <li>{index + 1}. {fruit}</li>
{/each}
```

Output:

1. Apple
2. Banana
3. Cherry

## Objects in Arrays

Most real data is more complex:

```svelte
<script>
  let users = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'User' },
    { id: 3, name: 'Charlie', role: 'User' }
  ]
</script>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    {#each users as user}
      <tr>
        <td>{user.name}</td>
        <td>{user.role}</td>
      </tr>
    {/each}
  </tbody>
</table>
```

## Destructuring

If you only need certain properties, destructure:

```svelte
{#each users as { name, role }}
  <tr>
    <td>{name}</td>
    <td>{role}</td>
  </tr>
{/each}
```

You can rename while destructuring:

```svelte
{#each users as { name: userName, role: userRole }}
  <p>{userName} is a {userRole}</p>
{/each}
```

## Keyed Each Blocks

Here's where things get important. Consider this:

```svelte
<script>
  let items = [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
    { id: 3, name: 'Third' }
  ]

  function removeFirst() {
    items = items.slice(1)
  }
</script>

{#each items as item}
  <Item data={item} />
{/each}
```

When you remove the first item, Svelte might reuse DOM nodes inefficiently. It could update the first node's content instead of removing it.

This matters when:

- Components have internal state
- You're using animations
- Elements have focus or input values

The fix: provide a key:

```svelte
{#each items as item (item.id)}
  <Item data={item} />
{/each}
```

The `(item.id)` tells Svelte to track items by their `id`. Now when you remove the first item, Svelte knows to remove that specific DOM node.

**Rule of thumb:** Always use keys when items have stable unique identifiers and the list changes dynamically.

## Empty States with {:else}

What if the array is empty? Use `{:else}`:

```svelte
{#each items as item}
  <Item data={item} />
{:else}
  <p>No items yet. Add some!</p>
{/each}
```

The `{:else}` block renders when the array is empty (length is 0).

## Comparing to Vue

Vue's list rendering:

```vue
<template>
  <ul>
    <li v-for="fruit in fruits" :key="fruit">
      {{ fruit }}
    </li>
  </ul>

  <li v-for="(user, index) in users" :key="user.id">
    {{ index }}. {{ user.name }}
  </li>
</template>
```

Svelte:

```svelte
<ul>
  {#each fruits as fruit (fruit)}
    <li>{fruit}</li>
  {/each}
</ul>

{#each users as user, index (user.id)}
  <li>{index}. {user.name}</li>
{/each}
```

Very similar. Vue uses a directive on elements; Svelte wraps elements in blocks.

## Nested Loops

You can nest each blocks:

```svelte
<script>
  let categories = [
    {
      name: 'Fruits',
      items: ['Apple', 'Banana', 'Cherry']
    },
    {
      name: 'Vegetables',
      items: ['Carrot', 'Broccoli', 'Spinach']
    }
  ]
</script>

{#each categories as category}
  <h2>{category.name}</h2>
  <ul>
    {#each category.items as item}
      <li>{item}</li>
    {/each}
  </ul>
{/each}
```

## Iterating Over Objects

Need to iterate over object keys? Use `Object.entries()`:

```svelte
<script>
  let scores = {
    Alice: 95,
    Bob: 87,
    Charlie: 92
  }
</script>

<ul>
  {#each Object.entries(scores) as [name, score]}
    <li>{name}: {score}</li>
  {/each}
</ul>
```

Or `Object.keys()`:

```svelte
{#each Object.keys(scores) as name}
  <li>{name}: {scores[name]}</li>
{/each}
```

## Practical Examples

**Todo list with removal:**

```svelte
<script>
  let todos = [
    { id: 1, text: 'Learn Svelte', done: false },
    { id: 2, text: 'Build something', done: false },
    { id: 3, text: 'Deploy it', done: false }
  ]

  function toggle(id) {
    todos = todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )
  }

  function remove(id) {
    todos = todos.filter(todo => todo.id !== id)
  }
</script>

<ul>
  {#each todos as todo (todo.id)}
    <li class:done={todo.done}>
      <input
        type="checkbox"
        checked={todo.done}
        onchange={() => toggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onclick={() => remove(todo.id)}>×</button>
    </li>
  {:else}
    <li class="empty">All done! 🎉</li>
  {/each}
</ul>

<style>
  .done span {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .empty {
    font-style: italic;
    color: #666;
  }
</style>
```

**Filtered and sorted list:**

```svelte
<script>
  let products = $state([
    { id: 1, name: 'Widget', price: 25, category: 'Tools' },
    { id: 2, name: 'Gadget', price: 50, category: 'Electronics' },
    { id: 3, name: 'Thingamajig', price: 15, category: 'Tools' },
    { id: 4, name: 'Doohickey', price: 35, category: 'Electronics' }
  ])

  let categoryFilter = $state('')
  let sortBy = $state('name')

  let filtered = $derived(
    categoryFilter
      ? products.filter(p => p.category === categoryFilter)
      : products
  )

  let sorted = $derived(
    [...filtered].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      return a.name.localeCompare(b.name)
    })
  )
</script>

<select bind:value={categoryFilter}>
  <option value="">All categories</option>
  <option value="Tools">Tools</option>
  <option value="Electronics">Electronics</option>
</select>

<select bind:value={sortBy}>
  <option value="name">Sort by name</option>
  <option value="price">Sort by price</option>
</select>

<ul>
  {#each sorted as product (product.id)}
    <li>
      {product.name} - £{product.price}
      <small>({product.category})</small>
    </li>
  {:else}
    <li>No products match your filter</li>
  {/each}
</ul>
```

**Grid of cards:**

```svelte
<script>
  let posts = [
    { id: 1, title: 'First Post', excerpt: 'This is...' },
    { id: 2, title: 'Second Post', excerpt: 'Another...' },
    { id: 3, title: 'Third Post', excerpt: 'Yet more...' }
  ]
</script>

<div class="grid">
  {#each posts as post (post.id)}
    <article>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <a href="/posts/{post.id}">Read more</a>
    </article>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  article {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
```

## Performance Tips

1. **Always key dynamic lists** — especially when items can be added, removed, or reordered
2. **Keep keys stable** — use IDs, not array indices
3. **Avoid complex expressions in templates** — move filtering/sorting to reactive declarations
4. **Consider virtualization** — for very long lists (1000+ items), look into virtual list libraries

## Key Takeaways

- `{#each array as item}` iterates over arrays
- Add index with `{#each array as item, index}`
- Use keys for dynamic lists: `{#each array as item (item.id)}`
- Destructure objects: `{#each users as { name, role }}`
- Handle empty arrays with `{:else}`
- Use `$derived()` for filtered/sorted lists

Next: [Lesson 8: Two-Way Binding](/articles/08-two-way-binding)
