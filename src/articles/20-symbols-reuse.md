---
title: "Symbols & Reuse"
description: "Stop repeating yourself. Learn to define reusable SVG components with symbol and use elements, and build efficient icon sprite systems."
tags: ["svg"]
pubDate: "2025-12-02T06:30:00Z"
link: "20-symbols-reuse"
---

## Lesson 20: Symbols & Reuse

One of SVG's superpowers is the ability to define something once and use it many times. This keeps your code DRY (Don't Repeat Yourself), reduces file size, and makes updates easier.

---

## The `<use>` Element

The `<use>` element creates a copy of another element by referencing its `id`:

```svg
<svg width="300" height="100">
  <circle id="dot" cx="20" cy="50" r="15" fill="#3b82f6" />

  <use href="#dot" x="50" />
  <use href="#dot" x="100" />
  <use href="#dot" x="150" />
</svg>
```

The `x` and `y` attributes on `<use>` offset the copy from the original's position.

### How `<use>` Works

- Creates a "shadow clone" of the referenced element
- The clone inherits styles from the original
- You can override some properties (like `x`, `y`, `fill` in some cases)
- Changes to the original update all copies

---

## The `<symbol>` Element

While `<use>` can reference any element, `<symbol>` is specifically designed for reusable graphics:

```svg
<svg width="300" height="100">
  <defs>
    <symbol id="star" viewBox="0 0 24 24">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
               fill="currentColor" />
    </symbol>
  </defs>

  <use href="#star" x="10" y="10" width="30" height="30" fill="gold" />
  <use href="#star" x="50" y="10" width="30" height="30" fill="silver" />
  <use href="#star" x="90" y="10" width="30" height="30" fill="#cd7f32" />
</svg>
```

### Symbol vs Regular Elements

| Feature                   | Regular Element | `<symbol>`                       |
| ------------------------- | --------------- | -------------------------------- |
| Has own `viewBox`         | No              | Yes                              |
| Rendered directly         | Yes             | No (only via `<use>`)            |
| Scalable via width/height | No              | Yes                              |
| Best for                  | Simple shapes   | Complex icons, reusable graphics |

The `viewBox` on `<symbol>` is crucial — it lets each `<use>` instance scale the symbol to any size.

---

## The `<defs>` Element

We've seen `<defs>` before for gradients and patterns. It's also the right place for symbols:

```svg
<svg>
  <defs>
    <symbol id="icon-home">...</symbol>
    <symbol id="icon-settings">...</symbol>
    <symbol id="icon-user">...</symbol>
    <linearGradient id="brand-gradient">...</linearGradient>
  </defs>

  <!-- Use them throughout the document -->
</svg>
```

Content inside `<defs>` isn't rendered until referenced.

---

## Building an Icon Sprite

An SVG sprite is a single file containing multiple icons:

```svg
<!-- icons.svg -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <symbol id="icon-search" viewBox="0 0 24 24">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <symbol id="icon-menu" viewBox="0 0 24 24">
    <path d="M4 6h16M4 12h16M4 18h16"
          stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>
</svg>
```

### Using the Sprite Inline

If the sprite is in your HTML:

```html
<svg class="icon" width="24" height="24">
  <use href="#icon-home"></use>
</svg>

<svg class="icon" width="24" height="24">
  <use href="#icon-search"></use>
</svg>
```

### Using an External Sprite File

```html
<svg class="icon" width="24" height="24">
  <use href="/icons.svg#icon-home"></use>
</svg>
```

Note: External references have CORS restrictions and don't work with `file://` URLs.

---

## The `currentColor` Keyword

Using `currentColor` makes icons inherit their colour from CSS:

```svg
<symbol id="icon-heart" viewBox="0 0 24 24">
  <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</symbol>
```

```css
.icon {
  color: #3b82f6;
}

.icon:hover {
  color: #1d4ed8;
}
```

The icon automatically uses the CSS `color` value.

---

## Grouping with `<g>`

The `<g>` (group) element bundles elements together:

```svg
<g id="smiley" transform="translate(50, 50)">
  <circle r="40" fill="yellow" stroke="black" stroke-width="2" />
  <circle cx="-15" cy="-10" r="5" fill="black" />
  <circle cx="15" cy="-10" r="5" fill="black" />
  <path d="M -20,10 Q 0,30 20,10" fill="none" stroke="black" stroke-width="3" />
</g>

<use href="#smiley" x="100" />
<use href="#smiley" x="200" />
```

Groups can be:

- Transformed as a unit
- Styled together
- Referenced with `<use>`

---

## Nested Symbols

Symbols can reference other symbols:

```svg
<defs>
  <symbol id="wheel" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="none" stroke="black" stroke-width="2" />
    <circle cx="10" cy="10" r="2" fill="black" />
  </symbol>

  <symbol id="car" viewBox="0 0 100 50">
    <rect x="10" y="10" width="80" height="25" rx="5" fill="#3b82f6" />
    <use href="#wheel" x="15" y="25" width="20" height="20" />
    <use href="#wheel" x="65" y="25" width="20" height="20" />
  </symbol>
</defs>

<use href="#car" x="10" y="10" width="150" height="75" />
```

---

## Practical Example: Icon Button Component

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-plus" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-width="2" stroke-linecap="round"
          d="M12 5v14M5 12h14" fill="none"/>
  </symbol>
</svg>

<!-- Usage in HTML -->
<button class="btn">
  <svg class="btn-icon" width="20" height="20">
    <use href="#icon-plus"></use>
  </svg>
  Add Item
</button>

<style>
  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-icon {
    color: currentColor;
  }
</style>
```

---

## Exercises

### Exercise 20.1: Rating Stars

Create a 5-star rating display using a single star symbol. Show 3 filled stars and 2 empty ones.

### Exercise 20.2: Icon Sprite

Create a sprite file with 3 icons (home, settings, user). Use them at different sizes on a page.

### Exercise 20.3: Repeating Pattern with `<use>`

Create a row of 10 identical shapes using `<use>` with different `x` offsets.

### Exercise 20.4: Colour-Changing Icons

Create an icon using `currentColor` that changes colour on hover using only CSS.

---

## Key Takeaways

- `<use>` creates copies of elements by referencing their `id`
- `<symbol>` is ideal for reusable graphics — it has its own `viewBox` and isn't rendered directly
- Put reusable definitions in `<defs>`
- SVG sprites combine multiple icons in one file for efficiency
- `currentColor` lets icons inherit colour from CSS
- `<g>` groups elements for collective transforms and styling

---

Next: [Lesson 21: Accessibility](/articles/21-accessibility)
