---
title: "What Is Svelte?"
description: "Discover why Svelte takes a fundamentally different approach to building UIs. Learn how the compiler-first philosophy eliminates runtime overhead and simplifies your code."
tags: ["svelte", "javascript", "fundamentals"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 2
---

# Lesson 1: What Is Svelte?

Svelte is a JavaScript framework for building user interfaces. But unlike React or Vue, Svelte doesn't ship a runtime to the browser. Instead, it compiles your components into efficient vanilla JavaScript at build time.

This isn't just a technical detail. It changes everything about how you write code.

## The Compiler Approach

When you write a React or Vue component, the framework code runs in the browser. It needs to:

- Track which parts of your UI depend on which data
- Diff the virtual DOM when state changes
- Figure out what actually needs to update

Svelte does all this work at compile time. When you build your app, Svelte analyzes your components and generates the exact JavaScript needed to update the DOM. No virtual DOM, no runtime diffing.

The result? Smaller bundles and faster updates.

## What This Means in Practice

Here's a counter in React:

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Clicks: {count}</button>;
}
```

And here's the same thing in Svelte:

```svelte
<script>
  let count = 0
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

No imports. No hooks. No special syntax for state. You just write `let count = 0` and Svelte figures out that `count` is reactive.

Behind the scenes, Svelte compiles this into JavaScript that surgically updates the button text when `count` changes. Nothing more, nothing less.

## Why Developers Love Svelte

**Less boilerplate.** You spend less time writing framework code and more time solving problems. State is just a variable. Props are just exports. Events are just functions.

**Smaller bundles.** No framework runtime means your app ships less JavaScript. For small apps, the difference is dramatic. For larger apps, you're still ahead.

**True reactivity.** Svelte's reactivity is built into the language, not bolted on. When you change a variable, the UI updates. It feels like the DOM is genuinely reactive.

**Easier to learn.** If you know HTML, CSS, and JavaScript, you can read a Svelte component and understand what it does. The learning curve is gentler than React or Vue.

## The Trade-offs

Every framework has trade-offs. With Svelte:

**Smaller ecosystem.** React and Vue have more libraries, tutorials, and Stack Overflow answers. Svelte is growing fast but it's still smaller.

**Different mental model.** If you're coming from React, you'll need to unlearn some patterns. Hooks don't exist. Context works differently. This can be disorienting at first.

**Build step required.** You can't drop Svelte into an HTML file with a script tag. You need a build process. (SvelteKit makes this painless.)

## Svelte vs SvelteKit

You'll hear both terms throughout this course:

**Svelte** is the component framework. It's what you use to build UI components with reactive state, props, events, and all the other pieces.

**SvelteKit** is the application framework built on top of Svelte. It adds routing, server-side rendering, data loading, and everything else you need for a full application.

Think of it like Vue and Nuxt, or React and Next.js. You can use Svelte without SvelteKit, but most projects will want SvelteKit.

We'll cover both in this course. First, we'll learn Svelte fundamentals. Then we'll build a full application with SvelteKit.

## Try It Yourself

If you want to experiment before your flight, you can try Svelte in the browser:

1. Go to [svelte.dev/playground](https://svelte.dev/playground)
2. You'll see a working Svelte component
3. Edit it and see the results instantly

The REPL is perfect for testing ideas without setting up a project.

## Key Takeaways

- Svelte compiles your code at build time, shipping no runtime to the browser
- This means less code, smaller bundles, and simpler syntax
- Variables are reactive by default — no special state management needed
- Svelte is the component framework; SvelteKit is the full application framework
- The ecosystem is smaller than React/Vue but the developer experience is excellent

Next: [Lesson 2: Your First Component](/articles/02-your-first-component)
