---
title: "Curves Deep Dive: Quadratic and Cubic Curves"
description: "Master SVG curves with an in-depth exploration of quadratic and cubic Bezier curves. Learn when to use each type and how to create smooth, organic shapes."
tags: ["svg"]
pubDate: "2025-11-30T10:00:00Z"
link: "07-curves"
series: "svg-basics"
seriesOrder: 7
---

## Lesson 07: Curves Deep Dive

Now that you've seen the curve commands, let's practice using them and understand when to reach for each type.

---

## Quick Recap

| Command | Control Points   | Best For                                  |
| ------- | ---------------- | ----------------------------------------- |
| `Q`     | 1                | Simple curves, symmetrical bends          |
| `C`     | 2                | Complex curves, S-shapes, precise control |
| `A`     | (ellipse params) | Circular arcs, rounded corners            |

---

## Quadratic Curves: When to Use

Quadratic curves (`Q`) are simpler but less flexible. Use them when:

- The curve is relatively simple
- You want symmetrical bends
- You're drawing by hand and want fewer points to manage

```svg
<svg width="300" height="200">
  <!-- A simple wave using Q and T -->
  <path
    d="M 20 100 Q 70 30, 120 100 T 220 100"
    stroke="steelblue"
    stroke-width="3"
    fill="none"
  />
</svg>
```

<svg width="300" height="200">
  <path
    d="M 20 100 Q 70 30, 120 100 T 220 100"
    stroke="steelblue"
    stroke-width="3"
    fill="none"
  />
</svg>

The `T` command creates smooth continuations automatically.

---

## Cubic Curves: When to Use

Cubic curves (`C`) give you more control. Use them when:

- You need an S-curve or inflection point
- You want precise control over entry and exit angles
- You're tracing a design from software (most tools export cubics)

```svg
<svg width="300" height="200">
  <!-- S-curve only possible with cubic -->
  <path
    d="M 20 150 C 80 150, 80 50, 150 50 S 280 50, 280 150"
    stroke="coral"
    stroke-width="3"
    fill="none"
  />
</svg>
```

<svg width="300" height="200">
  <path
    d="M 20 150 C 80 150, 80 50, 150 50 S 280 50, 280 150"
    stroke="coral"
    stroke-width="3"
    fill="none"
  />
</svg>

---

## Arc Shortcuts for Common Shapes

### Semicircle

```svg
<path d="M 50 100 A 50 50 0 1 1 150 100" stroke="black" fill="none" />
```

### Quarter Circle

```svg
<path d="M 100 50 A 50 50 0 0 1 150 100" stroke="black" fill="none" />
```

### Rounded Corner

```svg
<path d="M 20 100 H 80 A 20 20 0 0 1 100 120 V 180" stroke="black" fill="none" />
```

---

## Converting Between Curve Types

Most design tools export cubic curves. If you need simpler paths:

1. **Cubic to Quadratic**: Only possible for simple curves. You'll lose precision on complex shapes.

2. **Quadratic to Cubic**: Always possible. A quadratic `Q cx cy, x y` becomes:
   ```
   C (startX + 2/3*(cx-startX)) (startY + 2/3*(cy-startY)),
     (x + 2/3*(cx-x)) (y + 2/3*(cy-y)),
     x y
   ```

In practice, just let your tools handle this.

---

## Practical Exercise: Trace an Icon

Pick a simple icon (heart, star, arrow, etc.) and recreate it using path commands.

1. Start with the outline in your head
2. Break it into segments
3. Choose the right command for each segment
4. Connect them together

Example: Simple Arrow

```svg
<svg viewBox="0 0 24 24" width="100" height="100">
  <path
    d="M 5 12 H 16 M 12 8 L 16 12 L 12 16"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
</svg>
```

<svg viewBox="0 0 24 24" width="100" height="100">
  <path
    d="M 5 12 H 16 M 12 8 L 16 12 L 12 16"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
</svg>

---

## Exercise 7.1: Draw a Cloud

Using only curves (Q or C), draw a fluffy cloud shape.

## Exercise 7.2: Smooth Wave

Create a continuous smooth wave that spans 400 pixels horizontally using `Q` and `T`.

## Exercise 7.3: Speech Bubble

Create a speech bubble with rounded corners (using arcs) and a triangular pointer.

---

## Key Takeaways

- Quadratic (Q) = 1 control point, simpler
- Cubic (C) = 2 control points, more control
- Use T/S for smooth continuations
- Arcs (A) are best for circular/elliptical segments
- Match the command to the curve complexity

---

Next: [Lesson 08: Arcs](/articles/08-arcs)
