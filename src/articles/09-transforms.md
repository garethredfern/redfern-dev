---
title: "SVG Transforms: Translate, Rotate, Scale, and Skew"
description: "Learn how to use SVG transforms to move, rotate, scale, and skew elements. Understand the foundation of SVG animation and complex graphics."
tags: ["svg"]
pubDate: "2025-11-30T15:00:00Z"
link: "09-transforms"
---

## Lesson 09: Transforms

Transforms let you move, rotate, scale, and skew SVG elements without changing their underlying coordinates. They're the foundation of SVG animation.

---

## The transform Attribute

Apply transforms using the `transform` attribute:

```svg
<rect x="0" y="0" width="50" height="50" transform="translate(100, 100)" />
```

This rectangle is defined at (0, 0) but appears at (100, 100).

---

## Transform Types

### translate(x, y)

Move an element:

```svg
<svg width="200" height="200">
  <!-- Original position -->
  <rect x="10" y="10" width="40" height="40" fill="lightgray" />

  <!-- Translated -->
  <rect x="10" y="10" width="40" height="40" fill="steelblue"
        transform="translate(60, 60)" />
</svg>
```

<svg width="200" height="200">
  <rect x="10" y="10" width="40" height="40" fill="lightgray" />
  <rect x="10" y="10" width="40" height="40" fill="steelblue"
        transform="translate(60, 60)" />
</svg>

- `translate(50, 30)` — Move right 50, down 30
- `translate(50)` — Move right 50, Y defaults to 0

### rotate(angle)

Rotate around a point:

```svg
<svg width="200" height="200">
  <!-- Original -->
  <rect x="75" y="75" width="50" height="50" fill="lightgray" />

  <!-- Rotated 45 degrees around center -->
  <rect x="75" y="75" width="50" height="50" fill="coral"
        transform="rotate(45, 100, 100)" />
</svg>
```

<svg width="200" height="200">
  <rect x="75" y="75" width="50" height="50" fill="lightgray" />
  <rect x="75" y="75" width="50" height="50" fill="coral"
        transform="rotate(45, 100, 100)" />
</svg>

- `rotate(45)` — Rotate 45° around the origin (0, 0)
- `rotate(45, 100, 100)` — Rotate 45° around point (100, 100)

**Important:** Without specifying the center point, rotation happens around (0, 0), which usually isn't what you want!

### scale(x, y)

Make elements larger or smaller:

```svg
<svg width="200" height="200">
  <rect x="10" y="10" width="40" height="40" fill="lightgray" />

  <rect x="10" y="10" width="40" height="40" fill="mediumseagreen"
        transform="scale(2)" />
</svg>
```

<svg width="200" height="200">
  <rect x="10" y="10" width="40" height="40" fill="lightgray" />
  <rect x="10" y="10" width="40" height="40" fill="mediumseagreen"
        transform="scale(2)" />
</svg>

- `scale(2)` — Double the size (both X and Y)
- `scale(2, 1)` — Double width, keep height
- `scale(0.5)` — Half the size
- `scale(-1, 1)` — Flip horizontally

**Gotcha:** Scale also scales the coordinates! A rectangle at (10, 10) scaled by 2 appears at (20, 20).

### skewX(angle) and skewY(angle)

Slant elements:

```svg
<svg width="200" height="200">
  <rect x="50" y="50" width="60" height="60" fill="lightgray" />

  <rect x="50" y="50" width="60" height="60" fill="orchid"
        transform="skewX(20)" />
</svg>
```

<svg width="200" height="200">
  <rect x="50" y="50" width="60" height="60" fill="lightgray" />
  <rect x="50" y="50" width="60" height="60" fill="orchid"
        transform="skewX(20)" />
</svg>

- `skewX(20)` — Slant along X axis
- `skewY(20)` — Slant along Y axis

---

## Combining Transforms

Chain multiple transforms together:

```svg
<rect transform="translate(100, 100) rotate(45) scale(1.5)" />
```

**Order matters!** Transforms are applied right-to-left:

1. First: scale(1.5)
2. Then: rotate(45)
3. Finally: translate(100, 100)

Different orders produce different results:

```svg
<svg width="300" height="200">
  <!-- translate then rotate -->
  <rect x="0" y="0" width="40" height="40" fill="blue"
        transform="translate(50, 100) rotate(45)" />

  <!-- rotate then translate -->
  <rect x="0" y="0" width="40" height="40" fill="red"
        transform="rotate(45) translate(50, 100)" />
</svg>
```

<svg width="300" height="200">
  <rect x="0" y="0" width="40" height="40" fill="blue"
        transform="translate(50, 100) rotate(45)" />
  <rect x="0" y="0" width="40" height="40" fill="red"
        transform="rotate(45) translate(50, 100)" />
</svg>

---

## Transform Origin Problem

In SVG (unlike CSS), transforms default to the origin (0, 0). This causes unexpected behavior:

```svg
<svg width="200" height="200">
  <!-- This rotates around (0,0), not the rectangle's center! -->
  <rect x="75" y="75" width="50" height="50" fill="coral"
        transform="rotate(45)" />
</svg>
```

<svg width="200" height="200">
  <rect x="75" y="75" width="50" height="50" fill="coral"
        transform="rotate(45)" />
</svg>

### Solutions

**1. Specify rotation center:**

```svg
<rect x="75" y="75" width="50" height="50"
      transform="rotate(45, 100, 100)" />
```

**2. Position at origin, then translate:**

```svg
<rect x="-25" y="-25" width="50" height="50"
      transform="translate(100, 100) rotate(45)" />
```

**3. Use CSS transform-origin (when using CSS):**

```css
rect {
  transform-origin: center;
  transform: rotate(45deg);
}
```

---

## CSS Transforms vs SVG Transforms

SVG transforms can be applied via attribute or CSS:

```svg
<!-- Attribute -->
<rect transform="rotate(45, 100, 100)" />

<!-- CSS -->
<rect style="transform: rotate(45deg);" />
```

Key differences:

| Feature   | SVG Attribute  | CSS                   |
| --------- | -------------- | --------------------- |
| Syntax    | `rotate(45)`   | `rotate(45deg)`       |
| Origin    | (0, 0) default | center default        |
| Units     | unitless       | needs deg, px, etc.   |
| Animation | SMIL or JS     | transitions/keyframes |

CSS transforms are generally easier to animate, but the different default origins can cause confusion.

---

## Transforms on Groups

Apply transforms to `<g>` elements to transform multiple shapes:

```svg
<svg width="200" height="200">
  <g transform="translate(100, 100) rotate(45)">
    <rect x="-30" y="-30" width="60" height="60" fill="steelblue" />
    <circle cx="0" cy="0" r="20" fill="white" />
  </g>
</svg>
```

<svg width="200" height="200">
  <g transform="translate(100, 100) rotate(45)">
    <rect x="-30" y="-30" width="60" height="60" fill="steelblue" />
    <circle cx="0" cy="0" r="20" fill="white" />
  </g>
</svg>

The entire group (rectangle and circle) rotates together around the group's local origin.

---

## Nested Transforms

Transforms accumulate when nested:

```svg
<svg width="300" height="200">
  <g transform="translate(150, 100)">
    <!-- This group is at (150, 100) -->

    <g transform="rotate(30)">
      <!-- This group is rotated 30° around (150, 100) -->

      <rect x="-40" y="-20" width="80" height="40" fill="coral"
            transform="scale(1.2)" />
      <!-- This rect is also scaled -->
    </g>
  </g>
</svg>
```

<svg width="300" height="200">
  <g transform="translate(150, 100)">
    <g transform="rotate(30)">
      <rect x="-40" y="-20" width="80" height="40" fill="coral"
            transform="scale(1.2)" />
    </g>
  </g>
</svg>

Each level adds to the transformation stack.

---

## The Matrix Transform

All transforms can be expressed as a matrix:

```svg
<rect transform="matrix(a, b, c, d, e, f)" />
```

This is a 2D transformation matrix:

```
| a c e |
| b d f |
| 0 0 1 |
```

Where:

- a, d = scale
- b, c = skew
- e, f = translate

You rarely write matrices by hand, but you'll see them in exported SVGs.

---

## Practical Example: Loading Spinner

```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="20"
          fill="none"
          stroke="#e0e0e0"
          stroke-width="4" />

  <circle cx="25" cy="25" r="20"
          fill="none"
          stroke="#3b82f6"
          stroke-width="4"
          stroke-dasharray="80 126"
          stroke-linecap="round"
          transform="rotate(-90, 25, 25)">
    <!-- Animation will go here -->
  </circle>
</svg>
```

<svg width="50" height="50" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="20"
          fill="none"
          stroke="#e0e0e0"
          stroke-width="4" />
  <circle cx="25" cy="25" r="20"
          fill="none"
          stroke="#3b82f6"
          stroke-width="4"
          stroke-dasharray="80 126"
          stroke-linecap="round"
          transform="rotate(-90, 25, 25)">
  </circle>
</svg>

The `rotate(-90, 25, 25)` starts the arc at the top instead of the right.

---

## Exercise 9.1: Centering Rotation

Create a square that rotates around its own center. Do it two ways:

1. Using SVG transform with explicit center: `rotate(45, cx, cy)`
2. Using CSS with `transform-origin: center`

## Exercise 9.2: Scaling from Center

Create a circle that scales up by 1.5x from its center, not from (0, 0).

Hint: Translate to origin, scale, translate back.

## Exercise 9.3: Transform Hierarchy

Create three nested groups:

1. Outer group translated to (150, 150)
2. Middle group rotated 30°
3. Inner group containing a rectangle scaled 0.8

Observe how the transforms combine.

---

## Key Takeaways

- `translate`, `rotate`, `scale`, `skewX`, `skewY` are the main transforms
- SVG transforms default to origin (0, 0)
- Transform order matters (applied right-to-left)
- Use groups to transform multiple elements together
- CSS transforms have different syntax and default origin

---

Next: [Lesson 10: Transitions](10-transitions.md)
