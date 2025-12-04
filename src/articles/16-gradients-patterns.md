---
title: "Gradients & Patterns"
description: "Learn to create linear and radial gradients, plus repeating patterns for textures and backgrounds. Master the defs element for reusable SVG definitions."
tags: ["svg"]
pubDate: "2025-12-01T09:00:00Z"
link: "16-gradients-patterns"
series: "svg-basics"
seriesOrder: 16
---

## Lesson 16: Gradients & Patterns

So far we've filled shapes with solid colours. But SVG supports gradients and patterns too — and because they're defined in markup, you can animate them.

---

## The `<defs>` Element

Gradients and patterns are defined inside `<defs>` (definitions). Content inside `<defs>` isn't rendered directly — it's referenced by other elements.

```svg
<svg width="200" height="200">
  <defs>
    <!-- Define things here -->
  </defs>

  <!-- Use them here -->
</svg>
```

Think of `<defs>` as a library of reusable components.

---

## Linear Gradients

A linear gradient transitions between colours along a straight line.

```svg
<svg width="200" height="200">
  <defs>
    <linearGradient id="sunset">
      <stop offset="0%" stop-color="#ff6b6b" />
      <stop offset="50%" stop-color="#feca57" />
      <stop offset="100%" stop-color="#ff9ff3" />
    </linearGradient>
  </defs>

  <rect x="10" y="10" width="180" height="180" fill="url(#sunset)" />
</svg>
```

### Key Concepts

**id** — Required. You reference the gradient with `fill="url(#id)"`.

**stop** — Defines a colour at a position. You need at least two stops.

**offset** — Where the colour appears (0% = start, 100% = end).

**stop-color** — The colour at that position.

**stop-opacity** — Optional transparency (0 to 1).

### Gradient Direction

By default, linear gradients go left to right. Control direction with `x1`, `y1`, `x2`, `y2`:

```svg
<defs>
  <!-- Left to right (default) -->
  <linearGradient id="horizontal" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="blue" />
    <stop offset="100%" stop-color="red" />
  </linearGradient>

  <!-- Top to bottom -->
  <linearGradient id="vertical" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="blue" />
    <stop offset="100%" stop-color="red" />
  </linearGradient>

  <!-- Diagonal -->
  <linearGradient id="diagonal" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="blue" />
    <stop offset="100%" stop-color="red" />
  </linearGradient>
</defs>
```

The coordinates define a line: the gradient transitions along this line.

### spreadMethod

What happens outside the gradient bounds?

```svg
<linearGradient id="example" spreadMethod="pad">
  <!-- pad (default): extend the end colours -->
  <!-- repeat: tile the gradient -->
  <!-- reflect: mirror back and forth -->
</linearGradient>
```

---

## Radial Gradients

A radial gradient transitions from a center point outward in a circle (or ellipse).

```svg
<svg width="200" height="200">
  <defs>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="white" />
      <stop offset="50%" stop-color="#feca57" />
      <stop offset="100%" stop-color="#ff6b6b" />
    </radialGradient>
  </defs>

  <circle cx="100" cy="100" r="80" fill="url(#glow)" />
</svg>
```

### Controlling Shape and Position

```svg
<radialGradient id="example"
  cx="50%" cy="50%"   <!-- Center of the gradient -->
  r="50%"             <!-- Radius -->
  fx="30%" fy="30%"   <!-- Focal point (where 0% offset appears) -->
>
```

**cx, cy** — Center of the outer circle (where 100% offset appears).

**r** — Radius of the gradient.

**fx, fy** — Focal point. If different from cx/cy, creates an off-center highlight effect — great for 3D-looking spheres.

```svg
<svg width="200" height="200">
  <defs>
    <!-- Off-center focal point creates a 3D sphere effect -->
    <radialGradient id="sphere" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="white" />
      <stop offset="100%" stop-color="#3b82f6" />
    </radialGradient>
  </defs>

  <circle cx="100" cy="100" r="80" fill="url(#sphere)" />
</svg>
```

---

## Gradient Units

Two modes for specifying coordinates:

**objectBoundingBox** (default) — Percentages relative to the element using the gradient. A gradient defined once works on shapes of any size.

**userSpaceOnUse** — Absolute coordinates in the SVG's coordinate system. The gradient is fixed in space; shapes reveal different parts of it.

```svg
<linearGradient id="example" gradientUnits="userSpaceOnUse"
                x1="0" y1="0" x2="200" y2="200">
```

---

## Animating Gradients

You can animate gradient stops with CSS or SMIL:

```svg
<svg width="200" height="200">
  <defs>
    <linearGradient id="animated-gradient">
      <stop offset="0%" stop-color="#ff6b6b">
        <animate attributeName="stop-color"
                 values="#ff6b6b; #feca57; #ff6b6b"
                 dur="3s"
                 repeatCount="indefinite" />
      </stop>
      <stop offset="100%" stop-color="#3b82f6">
        <animate attributeName="stop-color"
                 values="#3b82f6; #a855f7; #3b82f6"
                 dur="3s"
                 repeatCount="indefinite" />
      </stop>
    </linearGradient>
  </defs>

  <rect x="10" y="10" width="180" height="180" fill="url(#animated-gradient)" />
</svg>
```

You can also animate the gradient position by animating `x1`, `y1`, `x2`, `y2`.

---

## Patterns

Patterns let you fill shapes with repeating graphics — textures, dots, stripes, or any SVG content.

```svg
<svg width="200" height="200">
  <defs>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="3" fill="#3b82f6" />
    </pattern>
  </defs>

  <rect x="10" y="10" width="180" height="180" fill="url(#dots)" />
</svg>
```

### Pattern Attributes

**width, height** — Size of one pattern tile.

**patternUnits** — How width/height are measured:

- `userSpaceOnUse` — Absolute pixels
- `objectBoundingBox` — Fraction of the filled element (0-1)

**patternContentUnits** — How content inside the pattern is measured.

### Stripe Pattern

```svg
<defs>
  <pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="5" height="10" fill="#3b82f6" />
  </pattern>
</defs>
```

### Diagonal Stripes

Use `patternTransform` to rotate:

```svg
<defs>
  <pattern id="diagonal-stripes" width="10" height="10"
           patternUnits="userSpaceOnUse"
           patternTransform="rotate(45)">
    <rect width="5" height="10" fill="#3b82f6" />
  </pattern>
</defs>
```

### Grid Pattern

```svg
<defs>
  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1" />
  </pattern>
</defs>
```

### Crosshatch Pattern

```svg
<defs>
  <pattern id="crosshatch" width="8" height="8" patternUnits="userSpaceOnUse">
    <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="#666" stroke-width="1" />
  </pattern>
</defs>
```

---

## Combining Gradients and Patterns

You can use gradients inside patterns:

```svg
<defs>
  <linearGradient id="bar-gradient">
    <stop offset="0%" stop-color="#3b82f6" />
    <stop offset="100%" stop-color="#1d4ed8" />
  </linearGradient>

  <pattern id="gradient-stripes" width="20" height="20" patternUnits="userSpaceOnUse">
    <rect width="10" height="20" fill="url(#bar-gradient)" />
  </pattern>
</defs>
```

---

## Practical Examples

### Sunset Sky Background

```svg
<defs>
  <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#1a1a2e" />
    <stop offset="40%" stop-color="#16213e" />
    <stop offset="70%" stop-color="#e94560" />
    <stop offset="100%" stop-color="#feca57" />
  </linearGradient>
</defs>

<rect width="100%" height="100%" fill="url(#sky)" />
```

### Glowing Orb (for your visualizer!)

```svg
<defs>
  <radialGradient id="orb-glow" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
    <stop offset="0%" stop-color="white" stop-opacity="1" />
    <stop offset="30%" stop-color="#a855f7" stop-opacity="0.8" />
    <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
  </radialGradient>
</defs>

<circle cx="100" cy="100" r="40" fill="url(#orb-glow)" />
```

### Blueprint Grid

```svg
<defs>
  <pattern id="blueprint" width="50" height="50" patternUnits="userSpaceOnUse">
    <!-- Major grid -->
    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#4a90a4" stroke-width="0.5" />
    <!-- Minor grid -->
    <path d="M 10 0 L 10 50 M 20 0 L 20 50 M 30 0 L 30 50 M 40 0 L 40 50
             M 0 10 L 50 10 M 0 20 L 50 20 M 0 30 L 50 30 M 0 40 L 50 40"
          fill="none" stroke="#4a90a4" stroke-width="0.2" />
  </pattern>
</defs>

<rect width="100%" height="100%" fill="#1e3a5f" />
<rect width="100%" height="100%" fill="url(#blueprint)" />
```

---

## Exercises

### Exercise 16.1: Sunset Button

Create a rounded rectangle with a sunset gradient (orange to pink to purple).

### Exercise 16.2: 3D Sphere

Create a circle that looks like a 3D sphere using a radial gradient with an off-center focal point.

### Exercise 16.3: Polka Dots

Create a pattern of evenly-spaced dots and fill a rectangle with it.

### Exercise 16.4: Animated Glow

Create a radial gradient that pulses (animates between bright and dim) using SMIL.

---

## Key Takeaways

- Define gradients and patterns in `<defs>`, reference with `url(#id)`
- Linear gradients: use `x1`, `y1`, `x2`, `y2` for direction
- Radial gradients: use `fx`, `fy` for off-center highlights
- Patterns tile automatically — control size with `width` and `height`
- `patternTransform` lets you rotate, scale, or skew patterns
- Gradient stops can be animated for dynamic effects

---

Next: [Lesson 17: Masks & Clip Paths](/articles/17-masks-clip-paths)
