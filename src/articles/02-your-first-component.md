---
title: "Your First Component"
description: "Learn the anatomy of a Svelte component file. Understand how script, markup, and styles work together in a single .svelte file."
tags: ["svelte", "components", "fundamentals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 3
---

# Lesson 2: Your First Component

Every Svelte component lives in a `.svelte` file. This file contains three parts: JavaScript logic, HTML markup, and CSS styles. All in one place.

## The Three Sections

Here's the simplest possible Svelte component:

```svelte
<script>
  let name = 'world'
</script>

<h1>Hello {name}!</h1>

<style>
  h1 {
    color: purple;
  }
</style>
```

Let's break this down:

**`<script>`** — Your JavaScript goes here. Variables, imports, functions, logic. This runs once when the component is created.

**Markup** — Your HTML template. This is what gets rendered. You can embed JavaScript expressions using curly braces `{}`.

**`<style>`** — Your CSS. This is scoped to the component by default. That `h1` style won't leak out to other components.

## Order Doesn't Matter

You can arrange these sections in any order. The convention is script, then markup, then style. But this works too:

```svelte
<h1>Hello {name}!</h1>

<style>
  h1 { color: purple; }
</style>

<script>
  let name = 'world'
</script>
```

Stick with the convention unless you have a reason not to.

## The Script Section

The script block is where you define your component's state and logic:

```svelte
<script>
  // Variables become reactive state
  let count = 0
  let name = 'Gareth'

  // Functions work normally
  function increment() {
    count++
  }

  // You can import other things
  import { onMount } from 'svelte'
  import Button from './Button.svelte'
</script>
```

Every variable you declare with `let` is potentially reactive. If you use it in your template and it changes, the template updates automatically.

Constants declared with `const` are not reactive (they can't change anyway).

## The Markup Section

The markup section is HTML with superpowers. You can:

**Embed expressions:**

```svelte
<p>The count is {count}</p>
<p>Double: {count * 2}</p>
<p>Uppercase: {name.toUpperCase()}</p>
```

Any valid JavaScript expression works inside the curly braces.

**Use components:**

```svelte
<script>
  import Button from './Button.svelte'
</script>

<Button />
<Button>Click me</Button>
```

Components are just imports. Use them like HTML elements.

**Spread attributes:**

```svelte
<script>
  let attrs = { type: 'text', placeholder: 'Enter name' }
</script>

<input {...attrs} />
```

## The Style Section

Styles in Svelte are scoped by default. This means:

```svelte
<style>
  p {
    color: blue;
  }
</style>

<p>This is blue</p>
```

That `p` rule only affects `<p>` elements inside this component. It won't turn every paragraph on the page blue.

Svelte achieves this by adding a unique class to your elements at compile time. You don't need to think about it — it just works.

**Global styles:**

If you need a style to apply globally, use `:global()`:

```svelte
<style>
  :global(body) {
    margin: 0;
    font-family: system-ui;
  }
</style>
```

Use this sparingly. Scoped styles are usually what you want.

## A Real Example

Let's put it together with a slightly more realistic component:

```svelte
<script>
  let tasks = ['Learn Svelte', 'Build something', 'Deploy it']
  let newTask = ''

  function addTask() {
    if (newTask.trim()) {
      tasks = [...tasks, newTask]
      newTask = ''
    }
  }
</script>

<div class="todo">
  <h2>My Tasks</h2>

  <form onsubmit={e => { e.preventDefault(); addTask() }}>
    <input
      type="text"
      bind:value={newTask}
      placeholder="Add a task"
    />
    <button type="submit">Add</button>
  </form>

  <ul>
    {#each tasks as task}
      <li>{task}</li>
    {/each}
  </ul>
</div>

<style>
  .todo {
    max-width: 400px;
    margin: 2rem auto;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  input {
    padding: 0.5rem;
    margin-right: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
</style>
```

Don't worry if some syntax is new — we'll cover `bind:value` and `{#each}` in later lessons. For now, notice how everything lives together in one file, easy to read and maintain.

## Component Files

Save your components with a `.svelte` extension:

```
src/
  components/
    Button.svelte
    Card.svelte
    Header.svelte
  routes/
    +page.svelte
```

Component names are typically PascalCase (like `Button`, not `button`). This helps distinguish them from regular HTML elements.

## Key Takeaways

- A Svelte component has three optional sections: `<script>`, markup, and `<style>`
- Variables in the script block are reactive when used in the template
- Styles are scoped to the component by default
- You can embed any JavaScript expression in the markup with `{}`
- Components are imported and used like HTML elements

Next: [Lesson 3: Reactivity Basics](/articles/03-reactivity-basics)
