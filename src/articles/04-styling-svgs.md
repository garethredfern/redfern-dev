---
title: "Styling SVGs"
description: "Learn how to style SVG elements using presentation attributes, inline CSS, and external stylesheets. Understand the cascade and specificity in SVG styling."
tags: ["svg"]
pubDate: "2025-11-29T10:00:00Z"
link: "04-styling-svgs"
---

## Lesson 04: Styling SVGs

You can style SVG elements in three ways: attributes, inline CSS, or external CSS. Each has its place. Understanding how they interact — and where they differ from HTML styling — is essential.

---

## Presentation Attributes

The simplest way to style SVGs is with attributes directly on the element:

```svg
<circle cx="50" cy="50" r="40" fill="blue" stroke="navy" stroke-width="3" />
```

These are called **presentation attributes**. They look like regular HTML attributes but control visual appearance.

### Common Presentation Attributes

| Attribute          | Description              | Example Values                           |
| ------------------ | ------------------------ | ---------------------------------------- |
| `fill`             | Interior colour          | `red`, `#ff0000`, `rgb(255,0,0)`, `none` |
| `stroke`           | Outline colour           | Same as fill                             |
| `stroke-width`     | Outline thickness        | `1`, `2.5`, `0.5`                        |
| `stroke-linecap`   | Line end style           | `butt`, `round`, `square`                |
| `stroke-linejoin`  | Corner style             | `miter`, `round`, `bevel`                |
| `stroke-dasharray` | Dashed lines             | `5,5`, `10,5,2,5`                        |
| `opacity`          | Overall transparency     | `0` to `1`                               |
| `fill-opacity`     | Fill transparency only   | `0` to `1`                               |
| `stroke-opacity`   | Stroke transparency only | `0` to `1`                               |

---

## Fill and Stroke

Every shape has two parts you can colour:

- **Fill** — the inside
- **Stroke** — the outline

```svg
<svg width="200" height="100">
  <!-- Just fill -->
  <rect x="10" y="10" width="50" height="80" fill="coral" />

  <!-- Just stroke -->
  <rect x="70" y="10" width="50" height="80" fill="none" stroke="coral" stroke-width="3" />

  <!-- Both -->
  <rect x="130" y="10" width="50" height="80" fill="coral" stroke="darkred" stroke-width="3" />
</svg>
```

### Special Fill Values

| Value              | Result                            |
| ------------------ | --------------------------------- |
| `none`             | Transparent (no fill)             |
| `currentColor`     | Inherits the CSS `color` property |
| `transparent`      | Same as none                      |
| `url(#gradientId)` | References a gradient or pattern  |

The `currentColor` value is incredibly useful for icons:

```svg
<svg fill="currentColor" viewBox="0 0 24 24">
  <path d="M12 2L2 7l10 5 10-5-10-5z" />
</svg>
```

```css
.icon {
  color: blue;
} /* Icon becomes blue */
.icon:hover {
  color: red;
} /* Icon becomes red on hover */
```

---

## Stroke Properties in Detail

### stroke-width

Controls line thickness:

```svg
<line x1="10" y1="20" x2="190" y2="20" stroke="black" stroke-width="1" />
<line x1="10" y1="50" x2="190" y2="50" stroke="black" stroke-width="5" />
<line x1="10" y1="80" x2="190" y2="80" stroke="black" stroke-width="10" />
```

### stroke-linecap

How line ends are drawn:

```svg
<svg width="200" height="120">
  <!-- butt (default) - ends exactly at the point -->
  <line x1="30" y1="30" x2="170" y2="30" stroke="black" stroke-width="15" stroke-linecap="butt" />

  <!-- round - adds a semicircle -->
  <line x1="30" y1="60" x2="170" y2="60" stroke="black" stroke-width="15" stroke-linecap="round" />

  <!-- square - adds a half-square -->
  <line x1="30" y1="90" x2="170" y2="90" stroke="black" stroke-width="15" stroke-linecap="square" />
</svg>
```

### stroke-linejoin

How corners are drawn:

```svg
<svg width="300" height="100">
  <polyline points="30,80 60,20 90,80" fill="none" stroke="black" stroke-width="15" stroke-linejoin="miter" />
  <polyline points="120,80 150,20 180,80" fill="none" stroke="black" stroke-width="15" stroke-linejoin="round" />
  <polyline points="210,80 240,20 270,80" fill="none" stroke="black" stroke-width="15" stroke-linejoin="bevel" />
</svg>
```

### stroke-dasharray

Creates dashed or dotted lines:

```svg
<svg width="200" height="120">
  <!-- Even dashes: 10px dash, 10px gap -->
  <line x1="10" y1="20" x2="190" y2="20" stroke="black" stroke-width="2" stroke-dasharray="10,10" />

  <!-- Short dashes: 5px dash, 5px gap -->
  <line x1="10" y1="50" x2="190" y2="50" stroke="black" stroke-width="2" stroke-dasharray="5,5" />

  <!-- Complex pattern: 15px dash, 5px gap, 5px dash, 5px gap -->
  <line x1="10" y1="80" x2="190" y2="80" stroke="black" stroke-width="2" stroke-dasharray="15,5,5,5" />
</svg>
```

---

## CSS Styling

SVG presentation attributes can also be written as CSS:

```svg
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" class="my-circle" />
</svg>
```

```css
.my-circle {
  fill: coral;
  stroke: darkred;
  stroke-width: 3;
}
```

### Three Ways to Apply CSS

**1. Inline style attribute:**

```svg
<circle cx="50" cy="50" r="40" style="fill: coral; stroke: darkred;" />
```

**2. Internal stylesheet (in the SVG):**

```svg
<svg width="100" height="100">
  <style>
    circle { fill: coral; }
  </style>
  <circle cx="50" cy="50" r="40" />
</svg>
```

**3. External stylesheet (when SVG is inline in HTML):**

```css
/* styles.css */
svg circle {
  fill: coral;
}
```

### CSS vs Attributes: Specificity

CSS declarations **override** presentation attributes:

```svg
<circle cx="50" cy="50" r="40" fill="blue" class="red-circle" />
```

```css
.red-circle {
  fill: red;
}
```

The circle will be **red**, not blue. CSS wins.

This specificity order (lowest to highest):

1. Presentation attributes
2. External/internal CSS
3. Inline `style` attribute
4. `!important` declarations

---

## What CSS Can and Can't Do

### CSS Can:

- Set fill, stroke, and most presentation attributes
- Apply transitions and animations
- Use `:hover`, `:focus`, and other pseudo-classes
- Use CSS variables
- Apply transforms

```css
circle {
  fill: blue;
  transition: fill 0.3s ease;
}

circle:hover {
  fill: red;
}
```

### CSS Cannot:

- Change geometric attributes (`cx`, `cy`, `r`, `x`, `y`, `width`, `height`, `d`, `points`)
- Access some SVG-specific features (gradients, patterns, filters must be defined in SVG)

This limitation is important: you **can't animate a circle's radius with CSS**. You'd need to use SVG's SMIL animations or JavaScript for that.

```css
/* This WON'T work */
circle {
  r: 40; /* Not a valid CSS property */
  transition: r 0.3s ease;
}

/* This WILL work */
circle {
  transform: scale(1);
  transition: transform 0.3s ease;
}
circle:hover {
  transform: scale(1.2);
}
```

---

## Inheritance

SVG elements inherit certain properties from their parents, just like HTML.

```svg
<svg fill="blue" font-family="sans-serif">
  <g stroke="red" stroke-width="2">
    <circle cx="50" cy="50" r="30" />   <!-- fill: blue, stroke: red -->
    <circle cx="120" cy="50" r="30" />  <!-- fill: blue, stroke: red -->
  </g>
</svg>
```

Properties that inherit:

- `fill`, `stroke`, `stroke-width` (and other stroke properties)
- `font-family`, `font-size`, `font-weight`
- `color`, `visibility`, `opacity`

---

## CSS Variables in SVGs

CSS custom properties work great with SVGs:

```css
:root {
  --icon-color: #3b82f6;
  --icon-size: 24px;
}

.icon {
  width: var(--icon-size);
  height: var(--icon-size);
  fill: var(--icon-color);
}

.icon:hover {
  --icon-color: #1d4ed8;
}
```

This makes theming icons trivial.

---

## Practical Example: Icon System

Here's how you might set up reusable icons:

```svg
<!-- icon-heart.svg -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
</svg>
```

```css
.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: currentColor;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
.icon-lg {
  width: 2rem;
  height: 2rem;
}

.icon:hover {
  color: var(--accent);
}
```

The icon inherits its colour from the parent's `color` property via `currentColor`.

---

## Exercise 4.1: Style a Shape

Create a rectangle with:

- Fill: `#3b82f6`
- Stroke: `#1d4ed8`
- Stroke width: 4
- Rounded corners: 10px

Do it once with attributes, then again with CSS.

## Exercise 4.2: Hover Effects

Create three circles in a row. Using CSS:

- Default: `fill: lightgray`
- On hover: `fill: tomato`, scale up by 10%
- Add a smooth transition

## Exercise 4.3: Icon Theming

Create an SVG icon (a simple shape is fine) that:

- Uses `currentColor` for its fill
- Changes colour when the parent container is hovered
- Uses CSS variables for its size

---

## Key Takeaways

- Style SVGs with presentation attributes or CSS
- CSS overrides presentation attributes
- `fill` = inside colour, `stroke` = outline colour
- Use `currentColor` for icons that inherit their colour
- CSS can't change geometric properties (cx, cy, r, etc.)
- Use CSS variables for theming

---

Next: [Lesson 05: Introduction to Paths](/articles/05-intro-to-paths)
