---
title: "Slots and Composition"
description: "Build flexible, reusable components with Svelte slots. Learn default slots, named slots, slot props, and composition patterns."
tags: ["svelte", "components", "composition"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 10
---

## Lesson 9: Slots and Composition

Props pass data down. But what about passing entire chunks of UI? That's where slots come in. They let you compose components like you compose HTML elements.

## The Default Slot

Think about HTML buttons:

```html
<button>Click me</button> <button><strong>Important</strong> action</button>
```

The content between the tags is flexible. Slots give your components the same power.

**Card.svelte:**

```svelte
<div class="card">
  <slot />
</div>

<style>
  .card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
```

**Usage:**

```svelte
<Card>
  <h2>My Title</h2>
  <p>Some content goes here.</p>
</Card>
```

Everything between `<Card>` and `</Card>` replaces the `<slot />`.

## Fallback Content

What if nothing is passed? Provide fallback content:

```svelte
<!-- Button.svelte -->
<button class="btn">
  <slot>Click me</slot>
</button>
```

```svelte
<Button />           <!-- Shows "Click me" -->
<Button>Submit</Button>  <!-- Shows "Submit" -->
```

Fallback content appears when the slot is empty.

## Named Slots

Sometimes you need multiple slots. Name them:

```svelte
<!-- Modal.svelte -->
<div class="modal">
  <header>
    <slot name="header">Default Header</slot>
  </header>

  <main>
    <slot>Default content</slot>
  </main>

  <footer>
    <slot name="footer">
      <button>Close</button>
    </slot>
  </footer>
</div>
```

**Usage:**

```svelte
<Modal>
  <h2 slot="header">Confirm Action</h2>

  <p>Are you sure you want to proceed?</p>

  <div slot="footer">
    <button onclick={cancel}>Cancel</button>
    <button onclick={confirm}>Confirm</button>
  </div>
</Modal>
```

Content without a `slot` attribute goes to the default (unnamed) slot.

## Slot Props

Slots can pass data back to the parent. This is powerful for flexible components.

**List.svelte:**

```svelte
<script>
  export let items = []
</script>

<ul>
  {#each items as item}
    <li>
      <slot {item} />
    </li>
  {/each}
</ul>
```

**Usage:**

```svelte
<script>
  let users = [
    { name: 'Alice', role: 'Admin' },
    { name: 'Bob', role: 'User' }
  ]
</script>

<List items={users} let:item>
  <strong>{item.name}</strong> — {item.role}
</List>
```

The `let:item` directive receives the `item` passed from the slot.

## More Slot Props

You can pass multiple values:

```svelte
<!-- DataTable.svelte -->
<script>
  export let data = []
  export let columns = []
</script>

<table>
  <thead>
    <tr>
      {#each columns as column}
        <th>
          <slot name="header" {column}>
            {column.label}
          </slot>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each data as row, index}
      <tr>
        {#each columns as column}
          <td>
            <slot {row} {column} {index}>
              {row[column.key]}
            </slot>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
```

**Usage:**

```svelte
<DataTable {data} {columns} let:row let:column>
  {#if column.key === 'status'}
    <span class="badge {row.status}">{row.status}</span>
  {:else if column.key === 'actions'}
    <button onclick={() => edit(row)}>Edit</button>
  {:else}
    {row[column.key]}
  {/if}
</DataTable>
```

## Checking for Slot Content

Sometimes you want to hide sections when slots are empty:

```svelte
<script>
  let hasHeader = false
  let hasFooter = false
</script>

<div class="card">
  {#if hasHeader}
    <header>
      <slot name="header" />
    </header>
  {/if}

  <main>
    <slot />
  </main>

  {#if hasFooter}
    <footer>
      <slot name="footer" />
    </footer>
  {/if}
</div>

<!-- Svelte 5 provides $$slots -->
```

In practice, fallback content often handles this well enough.

## Comparing to Vue

Vue's slots:

```vue
<!-- Modal.vue -->
<template>
  <div class="modal">
    <header>
      <slot name="header">Default Header</slot>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>

<!-- Usage -->
<Modal>
  <template #header>
    <h2>My Title</h2>
  </template>

  <p>Content here</p>

  <template #footer>
    <button>Close</button>
  </template>
</Modal>
```

Vue's scoped slots:

```vue
<List :items="users">
  <template #default="{ item }">
    <strong>{{ item.name }}</strong>
  </template>
</List>
```

Svelte:

```svelte
<List items={users} let:item>
  <strong>{item.name}</strong>
</List>
```

Similar concepts, slightly different syntax.

## Practical Patterns

**Wrapper component:**

```svelte
<!-- PageSection.svelte -->
<script>
  export let title = ''
  export let subtitle = ''
</script>

<section>
  {#if title}
    <h2>{title}</h2>
  {/if}
  {#if subtitle}
    <p class="subtitle">{subtitle}</p>
  {/if}

  <div class="content">
    <slot />
  </div>
</section>

<style>
  section {
    margin-bottom: 3rem;
  }

  .subtitle {
    color: #666;
    margin-top: -0.5rem;
  }

  .content {
    margin-top: 1rem;
  }
</style>
```

**Accordion:**

```svelte
<!-- Accordion.svelte -->
<script>
  export let title
  export let open = false
</script>

<details bind:open>
  <summary>
    <slot name="title">{title}</slot>
  </summary>
  <div class="content">
    <slot />
  </div>
</details>

<style>
  details {
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  summary {
    padding: 1rem;
    cursor: pointer;
    font-weight: 500;
  }

  .content {
    padding: 0 1rem 1rem;
  }
</style>
```

**Render prop pattern:**

```svelte
<!-- FetchData.svelte -->
<script>
  export let url

  let data = null
  let loading = true
  let error = null

  async function load() {
    loading = true
    error = null

    try {
      const response = await fetch(url)
      data = await response.json()
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }

  load()
</script>

<slot {data} {loading} {error} reload={load} />
```

**Usage:**

```svelte
<FetchData url="/api/users" let:data let:loading let:error let:reload>
  {#if loading}
    <Spinner />
  {:else if error}
    <p>Error: {error}</p>
    <button onclick={reload}>Retry</button>
  {:else}
    <UserList users={data} />
  {/if}
</FetchData>
```

## Composition Best Practices

1. **Keep slots focused** — A modal slot for header, body, and footer makes sense. Ten slots usually means you need a different approach.

2. **Provide good fallbacks** — Make components usable without all slots filled.

3. **Document slot props** — When using slot props, make it clear what's available.

4. **Consider alternatives** — Sometimes props with render functions or multiple components are clearer than complex slots.

## Key Takeaways

- `<slot />` renders content passed between component tags
- Named slots: `<slot name="header" />` with `slot="header"` on content
- Fallback content goes inside the slot tag
- Slot props (`<slot {data} />`) pass data to parent with `let:data`
- Slots enable flexible, composable components
- Use slots for UI composition, props for data

Next: [Lesson 10: Component Lifecycle](/articles/10-component-lifecycle)
