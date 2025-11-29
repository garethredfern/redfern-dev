---
title: "The SVG Coordinate System"
description: "Master the SVG coordinate system — understand how positioning works, how the origin is placed, and how to precisely control element placement in your graphics."
tags: ["svg"]
pubDate: "2025-11-29T09:00:00Z"
link: "03-coordinate-system"
---

## Lesson 03: The Coordinate System

Understanding SVG's coordinate system is crucial. It's different from what you might expect, and mastering it unlocks precise control over your graphics.

---

## The SVG Canvas

When you create an SVG, you're defining a canvas to draw on:

```svg
<svg width="400" height="300">
  <!-- Shapes go here -->
</svg>
```

This creates a canvas 400 units wide and 300 units tall.

## Origin and Axes

SVG uses a **Cartesian coordinate system**, but with a twist:

- **Origin (0,0)** is at the **top-left corner**
- **X axis** increases going **right**
- **Y axis** increases going **down** (not up!)

```
(0,0) ────────────────────► X
  │
  │
  │
  │
  ▼
  Y
```

This is the same as screen coordinates in most graphics systems, but opposite to mathematical convention where Y increases upward.

### Example

```svg
<svg width="200" height="200">
  <circle cx="0" cy="0" r="20" fill="red" />      <!-- Top-left -->
  <circle cx="200" cy="0" r="20" fill="green" />   <!-- Top-right -->
  <circle cx="0" cy="200" r="20" fill="blue" />    <!-- Bottom-left -->
  <circle cx="200" cy="200" r="20" fill="orange" /> <!-- Bottom-right -->
</svg>
```

Notice: higher Y values mean further **down**, not up.

---

## Units

By default, SVG uses **pixels** (or more precisely, "user units" that map 1:1 to pixels).

You can specify other units:

```svg
<rect x="1cm" y="1cm" width="5cm" height="3cm" />
<circle cx="50mm" cy="50mm" r="20mm" />
<text x="2em" y="3em">Hello</text>
```

Supported units: `px`, `em`, `ex`, `pt`, `pc`, `cm`, `mm`, `in`, `%`

In practice, most developers stick with unitless numbers (user units) and control sizing via `width`, `height`, and `viewBox`.

---

## The viewBox Attribute

This is where it gets interesting. The `viewBox` defines a **virtual coordinate system** independent of the actual display size.

```svg
<svg width="400" height="400" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
```

Let's break down `viewBox="0 0 100 100"`:

| Value | Meaning                          |
| ----- | -------------------------------- |
| `0`   | min-x (left edge of the viewBox) |
| `0`   | min-y (top edge of the viewBox)  |
| `100` | width of the viewBox             |
| `100` | height of the viewBox            |

Even though the SVG displays at 400×400 pixels, we're working in a 100×100 coordinate space. The circle at position (50, 50) appears centered, and its radius of 40 fills most of the space.

### Why Use viewBox?

**1. Scalability**

Design in a coordinate system that makes sense, then scale to any size:

```svg
<!-- Same viewBox, different display sizes -->
<svg width="50" height="50" viewBox="0 0 100 100">...</svg>
<svg width="200" height="200" viewBox="0 0 100 100">...</svg>
<svg width="800" height="800" viewBox="0 0 100 100">...</svg>
```

All three render identically, just at different sizes.

**2. Responsive SVGs**

Omit width and height, and the SVG scales to fit its container:

```svg
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
```

```css
svg {
  width: 100%;
  height: auto;
}
```

**3. Panning**

Change the first two values to "pan" around a larger scene:

```svg
<!-- Looking at top-left -->
<svg width="200" height="200" viewBox="0 0 100 100">...</svg>

<!-- Panned right -->
<svg width="200" height="200" viewBox="50 0 100 100">...</svg>

<!-- Panned down -->
<svg width="200" height="200" viewBox="0 50 100 100">...</svg>
```

**4. Zooming**

Change the last two values to "zoom":

```svg
<!-- Normal view -->
<svg width="200" height="200" viewBox="0 0 100 100">...</svg>

<!-- Zoomed in (smaller viewBox = closer) -->
<svg width="200" height="200" viewBox="25 25 50 50">...</svg>

<!-- Zoomed out (larger viewBox = further) -->
<svg width="200" height="200" viewBox="-50 -50 200 200">...</svg>
```

---

## Aspect Ratio: preserveAspectRatio

What happens when the viewBox aspect ratio doesn't match the SVG's display aspect ratio?

```svg
<svg width="400" height="200" viewBox="0 0 100 100">
  <!-- viewBox is square (1:1), display is wide (2:1) -->
</svg>
```

The `preserveAspectRatio` attribute controls this. The default is `xMidYMid meet`.

### Alignment (First Part)

The first part controls where the viewBox sits within the viewport:

| Value  | Horizontal | Vertical |
| ------ | ---------- | -------- |
| `xMin` | Left       | —        |
| `xMid` | Center     | —        |
| `xMax` | Right      | —        |
| `YMin` | —          | Top      |
| `YMid` | —          | Middle   |
| `YMax` | —          | Bottom   |

Combined: `xMinYMin`, `xMidYMin`, `xMaxYMid`, etc.

### Scaling (Second Part)

| Value   | Behaviour                                                                    |
| ------- | ---------------------------------------------------------------------------- |
| `meet`  | Scale to fit entirely inside (like `background-size: contain`)               |
| `slice` | Scale to fill completely, cropping if needed (like `background-size: cover`) |

### Examples

```svg
<!-- Centered, fit inside -->
<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">

<!-- Top-left aligned, fill completely -->
<svg viewBox="0 0 100 100" preserveAspectRatio="xMinYMin slice">

<!-- Ignore aspect ratio, stretch to fit -->
<svg viewBox="0 0 100 100" preserveAspectRatio="none">
```

---

## Negative Coordinates

Coordinates can be negative. This is useful when you want your origin elsewhere:

```svg
<svg width="200" height="200" viewBox="-100 -100 200 200">
  <!-- Origin is now at the CENTER of the SVG -->
  <circle cx="0" cy="0" r="50" fill="red" />
</svg>
```

Now (0, 0) is in the middle, which can make certain drawings more intuitive.

---

## Practical Example: An Icon

Let's design an icon with a nice viewBox:

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <!-- Simple check icon -->
  <polyline points="4 12 9 17 20 6" />
</svg>
```

Why `viewBox="0 0 24 24"`?

- **24×24 is a common icon size** — matches design system conventions
- **Integer coordinates** — easier to reason about
- **Scalable** — display at 16px, 24px, 48px, whatever you need

---

## Exercise 3.1: Understanding viewBox

Given this SVG:

```svg
<svg width="200" height="200" viewBox="0 0 50 50">
  <rect x="10" y="10" width="30" height="30" fill="blue" />
</svg>
```

1. What pixel dimensions will the rectangle appear to have on screen?
2. If you change viewBox to `"0 0 100 100"`, what happens to the rectangle?
3. If you change viewBox to `"10 10 30 30"`, what do you see?

## Exercise 3.2: Create a Responsive Icon

Design a simple "play button" icon:

- Use `viewBox="0 0 100 100"`
- Circle background centered at (50, 50) with radius 45
- Triangle pointing right inside the circle

The icon should scale smoothly when you change the SVG's width and height.

## Exercise 3.3: Centered Coordinate System

Create an SVG with the origin at the center:

- viewBox should go from -50 to 50 on both axes
- Draw a plus sign using two `<line>` elements through the origin
- Add four circles, one in each quadrant

---

## Key Takeaways

- SVG origin (0,0) is at top-left; Y increases downward
- `viewBox` creates a virtual coordinate system that scales to fit
- Format: `viewBox="min-x min-y width height"`
- `preserveAspectRatio` controls scaling behavior when aspect ratios differ
- Negative coordinates are valid and useful for centering the origin

---

Next: [Lesson 04: Styling SVGs](/articles/04-styling-svgs.md)
