---
title: "Stores for State"
description: "Manage shared state across components with Svelte stores. Learn writable, readable, and derived stores with the auto-subscription syntax."
tags: ["svelte", "stores", "state-management"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 12
---

## Lesson 11: Stores for State

So far, state has lived inside components. But what about state that needs to be shared across many components? Svelte stores solve this elegantly.

## The Problem

Imagine a shopping cart. The header shows the item count. The cart page shows details. The checkout button needs the total. Without stores, you'd pass cart data through every level of components.

Stores let any component access shared state directly.

## Creating a Writable Store

```javascript
// stores/cart.js
import { writable } from "svelte/store";

export const cart = writable([]);
```

That's it. `writable` creates a store with an initial value (empty array). Any component can now import and use it.

## Using a Store

The magic syntax: prefix with `$` to auto-subscribe:

```svelte
<script>
  import { cart } from '../stores/cart.js'
</script>

<p>Items in cart: {$cart.length}</p>

<ul>
  {#each $cart as item}
    <li>{item.name} - £{item.price}</li>
  {/each}
</ul>
```

`$cart` gives you the current value. When the store updates, the component re-renders automatically.

## Updating a Store

Three methods for modifying writable stores:

**set** — Replace the entire value:

```svelte
<script>
  import { cart } from '../stores/cart.js'

  function clearCart() {
    cart.set([])
  }
</script>
```

**update** — Modify based on current value:

```svelte
<script>
  import { cart } from '../stores/cart.js'

  function addItem(item) {
    cart.update(items => [...items, item])
  }

  function removeItem(id) {
    cart.update(items => items.filter(item => item.id !== id))
  }
</script>
```

**Direct assignment with $** — Syntactic sugar for set:

```svelte
<script>
  import { cart } from '../stores/cart.js'

  function clearCart() {
    $cart = []  // Same as cart.set([])
  }

  function addItem(item) {
    $cart = [...$cart, item]  // Same as cart.update(...)
  }
</script>
```

The `$` prefix works both for reading and writing.

## Readable Stores

Some state should only change internally. Use `readable`:

```javascript
// stores/time.js
import { readable } from "svelte/store";

export const time = readable(new Date(), (set) => {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  // Return cleanup function
  return () => clearInterval(interval);
});
```

The second argument is a start function that runs when the first subscriber arrives. It returns a cleanup function for when the last subscriber leaves.

Usage:

```svelte
<script>
  import { time } from '../stores/time.js'
</script>

<p>Current time: {$time.toLocaleTimeString()}</p>
```

Components can read `$time` but can't call `time.set()` — the store controls its own updates.

## Derived Stores

Stores that compute values from other stores:

```javascript
// stores/cart.js
import { writable, derived } from "svelte/store";

export const cart = writable([]);

export const itemCount = derived(cart, ($cart) => $cart.length);

export const total = derived(cart, ($cart) =>
  $cart.reduce((sum, item) => sum + item.price, 0)
);
```

Usage:

```svelte
<script>
  import { cart, itemCount, total } from '../stores/cart.js'
</script>

<header>
  <span>Cart ({$itemCount})</span>
</header>

<footer>
  <p>Total: £{$total.toFixed(2)}</p>
</footer>
```

Derived stores update automatically when their source stores change.

**Multiple sources:**

```javascript
export const summary = derived([cart, user], ([$cart, $user]) => ({
  items: $cart.length,
  user: $user.name,
  total: $cart.reduce((sum, item) => sum + item.price, 0),
}));
```

## Custom Stores

For complex logic, create custom stores with methods:

```javascript
// stores/cart.js
import { writable, derived } from "svelte/store";

function createCart() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    addItem: (item) =>
      update((items) => {
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          return items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...items, { ...item, quantity: 1 }];
      }),
    removeItem: (id) =>
      update((items) => items.filter((item) => item.id !== id)),
    updateQuantity: (id, quantity) =>
      update((items) =>
        items.map((item) => (item.id === id ? { ...item, quantity } : item))
      ),
    clear: () => set([]),
  };
}

export const cart = createCart();

export const total = derived(cart, ($cart) =>
  $cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
);
```

Usage:

```svelte
<script>
  import { cart, total } from '../stores/cart.js'
</script>

<button onclick={() => cart.addItem(product)}>
  Add to Cart
</button>

<button onclick={() => cart.removeItem(item.id)}>
  Remove
</button>

<button onclick={() => cart.clear()}>
  Clear Cart
</button>

<p>Total: £{$total.toFixed(2)}</p>
```

Clean API, encapsulated logic.

## Store Contract

Any object with a `subscribe` method is a valid store. This means you can wrap other reactive systems:

```javascript
// Wrap a simple value
function createSimpleStore(initial) {
  let value = initial;
  const subscribers = new Set();

  return {
    subscribe(fn) {
      subscribers.add(fn);
      fn(value); // Call immediately with current value

      return () => subscribers.delete(fn);
    },
    set(newValue) {
      value = newValue;
      subscribers.forEach((fn) => fn(value));
    },
  };
}
```

## Comparing to Vue

Vue's reactive state:

```javascript
// Pinia store
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),
  getters: {
    total: (state) => state.items.reduce((sum, i) => sum + i.price, 0),
  },
  actions: {
    addItem(item) {
      this.items.push(item);
    },
  },
});
```

Svelte stores are simpler. No special wrapper needed — just import and use with `$`.

## Practical Example: Theme Store

```javascript
// stores/theme.js
import { writable, derived } from "svelte/store";

function createThemeStore() {
  // Check localStorage and system preference
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null;

  const prefersDark =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;

  const initial = stored || (prefersDark ? "dark" : "light");

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    toggle: () => {
      let newTheme;
      const unsubscribe = subscribe((current) => {
        newTheme = current === "light" ? "dark" : "light";
      });
      unsubscribe();

      set(newTheme);
      localStorage.setItem("theme", newTheme);
    },
    set: (theme) => {
      set(theme);
      localStorage.setItem("theme", theme);
    },
  };
}

export const theme = createThemeStore();

export const isDark = derived(theme, ($theme) => $theme === "dark");
```

```svelte
<script>
  import { theme, isDark } from '../stores/theme.js'
</script>

<button onclick={theme.toggle}>
  {$isDark ? '☀️ Light' : '🌙 Dark'}
</button>

<div class:dark={$isDark}>
  Content here
</div>
```

## Key Takeaways

- `writable(initialValue)` creates a store you can read and write
- `readable(initialValue, start)` creates a read-only store
- `derived(stores, fn)` computes values from other stores
- Use `$storeName` for auto-subscription in components
- Create custom stores by wrapping writable with methods
- Any object with `subscribe` is a valid store

Next: [Lesson 12: Context API](/articles/12-context-api)
