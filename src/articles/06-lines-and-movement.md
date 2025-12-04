---
title: "Lines and Movement in SVG Paths"
description: "Learn how to draw straight lines and navigate paths in SVG. Master the M, L, H, V, and Z commands to create connected and disconnected shapes."
tags: ["svg"]
pubDate: "2025-11-30"
link: "06-lines-and-movement"
series: "svg-basics"
seriesOrder: 6
---

## Lesson 06: Lines and Movement

Now that you understand basic path commands, let's explore more about how they work together and introduce curve commands.

---

## Recap: The Drawing Model

Think of path commands as instructions to a pen:

1. **M** puts the pen down at a position
2. **L, H, V** draw straight lines
3. **Z** connects back to the start
4. **Curves** (coming up) draw smooth arcs

The pen always remembers where it is. Every command moves the pen.

---

## Combining Subpaths

A single path can contain multiple disconnected shapes using multiple M commands:

```svg
<svg width="200" height="100">
  <path d="M 20 20 H 80 V 80 H 20 Z
           M 120 20 H 180 V 80 H 120 Z"
        fill="steelblue" />
</svg>
```

<svg width="200" height="100">
  <path d="M 20 20 H 80 V 80 H 20 Z
           M 120 20 H 180 V 80 H 120 Z"
        fill="steelblue" />
</svg>

This draws two separate rectangles as a single path. Why would you do this?

- Fewer DOM elements (better performance)
- Share styles automatically
- Some animations work better with single paths
- Create shapes with holes (using fill-rule)

---

## Creating Holes with Subpaths

Draw two shapes where one is inside the other, going in opposite directions:

```svg
<svg width="200" height="200">
  <path d="M 20 20 H 180 V 180 H 20 Z
           M 60 60 V 140 H 140 V 60 Z"
        fill="navy" fill-rule="evenodd" />
</svg>
```

<svg width="200" height="200">
  <path d="M 20 20 H 180 V 180 H 20 Z
           M 60 60 V 140 H 140 V 60 Z"
        fill="navy" fill-rule="evenodd" />
</svg>

The outer square goes clockwise (via H then V). The inner square goes counter-clockwise (via V then H). With `fill-rule="evenodd"`, the inner area becomes a hole.

---

## Quadratic Bézier Curves: Q

Now for curves! A quadratic Bézier curve uses one control point:

```
Q cx cy, x y
```

- `cx, cy` — The control point (the curve bends toward this)
- `x, y` — The end point

```svg
<svg width="200" height="200">
  <!-- The curve -->
  <path d="M 20 100 Q 100 20, 180 100"
        stroke="blue" stroke-width="3" fill="none" />

  <!-- Visualise the control point -->
  <circle cx="100" cy="20" r="5" fill="red" />
  <line x1="20" y1="100" x2="100" y2="20" stroke="red" stroke-dasharray="4" />
  <line x1="100" y1="20" x2="180" y2="100" stroke="red" stroke-dasharray="4" />
</svg>
```

<svg width="200" height="200">
  <path d="M 20 100 Q 100 20, 180 100"
        stroke="blue" stroke-width="3" fill="none" />
  <circle cx="100" cy="20" r="5" fill="red" />
  <line x1="20" y1="100" x2="100" y2="20" stroke="red" stroke-dasharray="4" />
  <line x1="100" y1="20" x2="180" y2="100" stroke="red" stroke-dasharray="4" />
</svg>

The curve starts at (20, 100), bends toward the control point at (100, 20), and ends at (180, 100).

### How Control Points Work

The curve doesn't pass through the control point — it's pulled toward it. Imagine the control point has gravity:

- Closer control point = gentler curve
- Further control point = sharper curve
- Control point position determines the curve's direction

---

## Smooth Quadratic: T

`T x y` — Continue with a smooth quadratic curve.

The control point is automatically calculated as a reflection of the previous control point:

```svg
<svg width="300" height="200">
  <path d="M 20 100 Q 60 20, 100 100 T 180 100 T 260 100"
        stroke="purple" stroke-width="3" fill="none" />
</svg>
```

<svg width="300" height="200">
  <path d="M 20 100 Q 60 20, 100 100 T 180 100 T 260 100"
        stroke="purple" stroke-width="3" fill="none" />
</svg>

Each T creates a smooth wave. The control point mirrors automatically, creating continuous curves.

---

## Cubic Bézier Curves: C

Cubic curves have **two** control points, giving more control:

```
C cx1 cy1, cx2 cy2, x y
```

- `cx1, cy1` — First control point (affects start of curve)
- `cx2, cy2` — Second control point (affects end of curve)
- `x, y` — End point

```svg
<svg width="200" height="200">
  <!-- The curve -->
  <path d="M 20 180 C 20 20, 180 20, 180 180"
        stroke="green" stroke-width="3" fill="none" />

  <!-- Visualise control points -->
  <circle cx="20" cy="20" r="5" fill="red" />
  <circle cx="180" cy="20" r="5" fill="red" />
  <line x1="20" y1="180" x2="20" y2="20" stroke="red" stroke-dasharray="4" />
  <line x1="180" y1="20" x2="180" y2="180" stroke="red" stroke-dasharray="4" />
</svg>
```

<svg width="200" height="200">
  <path d="M 20 180 C 20 20, 180 20, 180 180"
        stroke="green" stroke-width="3" fill="none" />
  <circle cx="20" cy="20" r="5" fill="red" />
  <circle cx="180" cy="20" r="5" fill="red" />
  <line x1="20" y1="180" x2="20" y2="20" stroke="red" stroke-dasharray="4" />
  <line x1="180" y1="20" x2="180" y2="180" stroke="red" stroke-dasharray="4" />
</svg>

This creates an S-curve (or in this case, a U-shape).

### When to Use Cubic vs Quadratic

- **Quadratic (Q)**: Simpler, good for basic curves, symmetrical bends
- **Cubic (C)**: More control, can create S-curves, asymmetrical shapes

Most professional design tools (Figma, Illustrator) export cubic curves.

---

## Smooth Cubic: S

`S cx2 cy2, x y` — Continue with a smooth cubic curve.

The first control point is reflected from the previous curve's second control point:

```svg
<svg width="300" height="200">
  <path d="M 20 100 C 20 50, 80 50, 80 100 S 140 150, 140 100 S 200 50, 200 100"
        stroke="teal" stroke-width="3" fill="none" />
</svg>
```

<svg width="300" height="200">
  <path d="M 20 100 C 20 50, 80 50, 80 100 S 140 150, 140 100 S 200 50, 200 100"
        stroke="teal" stroke-width="3" fill="none" />
</svg>

S is perfect for creating smooth, continuous wavy lines.

---

## Arcs: A

Arcs draw portions of ellipses. They're the most complex command:

```
A rx ry rotation large-arc sweep x y
```

| Parameter   | Description                          |
| ----------- | ------------------------------------ |
| `rx`        | Horizontal radius                    |
| `ry`        | Vertical radius                      |
| `rotation`  | X-axis rotation in degrees           |
| `large-arc` | 0 = smaller arc, 1 = larger arc      |
| `sweep`     | 0 = counter-clockwise, 1 = clockwise |
| `x y`       | End point                            |

```svg
<svg width="200" height="200">
  <!-- Quarter circle -->
  <path d="M 100 20 A 80 80 0 0 1 180 100"
        stroke="coral" stroke-width="3" fill="none" />
</svg>
```

<svg width="200" height="200">
  <path d="M 100 20 A 80 80 0 0 1 180 100"
        stroke="coral" stroke-width="3" fill="none" />
</svg>

### The Four Possible Arcs

Given a start point, end point, and radii, there are four possible arcs. The `large-arc` and `sweep` flags choose which one:

```svg
<svg width="400" height="200">
  <!-- All four combinations -->
  <path d="M 50 100 A 40 40 0 0 0 130 100" stroke="red" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 0 1 130 100" stroke="blue" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 1 0 130 100" stroke="green" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 1 1 130 100" stroke="purple" fill="none" stroke-width="2" />
</svg>
```

<svg width="400" height="200">
  <path d="M 50 100 A 40 40 0 0 0 130 100" stroke="red" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 0 1 130 100" stroke="blue" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 1 0 130 100" stroke="green" fill="none" stroke-width="2" />
  <path d="M 50 100 A 40 40 0 1 1 130 100" stroke="purple" fill="none" stroke-width="2" />
</svg>

Arcs are tricky. Most people use design tools to generate them and just tweak values.

---

## Practical Example: Speech Bubble

```svg
<svg viewBox="0 0 200 150">
  <path d="M 20 20
           H 180
           Q 190 20, 190 30
           V 100
           Q 190 110, 180 110
           H 60
           L 40 140
           L 50 110
           H 20
           Q 10 110, 10 100
           V 30
           Q 10 20, 20 20
           Z"
        fill="#eee" stroke="white" stroke-width="2" />
</svg>
```

<svg viewBox="0 0 200 150">
  <path d="M 20 20
           H 180
           Q 190 20, 190 30
           V 100
           Q 190 110, 180 110
           H 60
           L 40 140
           L 50 110
           H 20
           Q 10 110, 10 100
           V 30
           Q 10 20, 20 20
           Z"
        fill="#eee" stroke="white" stroke-width="2" />
</svg>

This combines:

- Straight lines (H, V, L)
- Rounded corners (Q curves)
- A pointer (L commands)

---

## Exercise 6.1: Draw a Heart

Create a heart shape using two cubic curves. Start at the bottom point, curve up to form each half, and meet at the top.

Hint: Use two C commands, one for the left lobe and one for the right.

## Exercise 6.2: Wavy Line

Create a horizontal wavy line using Q and T commands. Make it span the width of your viewBox with at least 3 waves.

## Exercise 6.3: Rounded Rectangle (Hard Mode)

Create a rounded rectangle using only path commands (M, L, and A for the corners). Don't use `<rect>` with rx/ry!

---

## Quick Reference: Curve Commands

| Command | Parameters                | Description                       |
| ------- | ------------------------- | --------------------------------- |
| `Q`     | cx cy, x y                | Quadratic curve (1 control point) |
| `T`     | x y                       | Smooth quadratic continuation     |
| `C`     | cx1 cy1, cx2 cy2, x y     | Cubic curve (2 control points)    |
| `S`     | cx2 cy2, x y              | Smooth cubic continuation         |
| `A`     | rx ry rot large sweep x y | Elliptical arc                    |

---

## Key Takeaways

- Paths can contain multiple subpaths (multiple M commands)
- Opposite-direction subpaths create holes with evenodd
- Quadratic curves (Q) have one control point
- Cubic curves (C) have two control points
- T and S create smooth continuations
- Arcs (A) are complex but draw perfect elliptical sections

---

Next: [Lesson 07: Curves](/articles/07-curves)
