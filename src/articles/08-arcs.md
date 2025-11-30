---
title: "Arcs in SVG Paths"
description: "Master the SVG arc command for drawing circular and elliptical curves. Learn the arc parameters, flags, and how to create rounded corners and pie charts."
tags: ["svg"]
pubDate: "2025-11-30T15:00:00Z"
link: "08-arcs"
---

## Lesson 08: Arcs

The arc command (`A`) draws elliptical curves. It's the most complex path command but essential for circles, rounded corners, and pie charts.

---

## Arc Syntax

```
A rx ry x-axis-rotation large-arc-flag sweep-flag x y
```

| Parameter         | Description                          |
| ----------------- | ------------------------------------ |
| `rx`              | Horizontal radius                    |
| `ry`              | Vertical radius                      |
| `x-axis-rotation` | Rotation of ellipse (degrees)        |
| `large-arc-flag`  | 0 = small arc, 1 = large arc         |
| `sweep-flag`      | 0 = counter-clockwise, 1 = clockwise |
| `x y`             | End point                            |

---

## Understanding the Flags

Given a start point, end point, and radii, there are **four** possible arcs. The flags select which one:

```svg
<svg width="300" height="300">
  <!-- Start and end points -->
  <circle cx="100" cy="100" r="5" fill="green" />
  <circle cx="200" cy="100" r="5" fill="red" />

  <!-- Four possible arcs -->
  <!-- small, counter-clockwise -->
  <path d="M 100 100 A 60 60 0 0 0 200 100" stroke="blue" fill="none" stroke-width="2" />

  <!-- small, clockwise -->
  <path d="M 100 100 A 60 60 0 0 1 200 100" stroke="orange" fill="none" stroke-width="2" />

  <!-- large, counter-clockwise -->
  <path d="M 100 100 A 60 60 0 1 0 200 100" stroke="purple" fill="none" stroke-width="2" />

  <!-- large, clockwise -->
  <path d="M 100 100 A 60 60 0 1 1 200 100" stroke="teal" fill="none" stroke-width="2" />
</svg>
```

<svg width="300" height="300">
  <circle cx="100" cy="100" r="5" fill="green" />
  <circle cx="200" cy="100" r="5" fill="red" />
  <path d="M 100 100 A 60 60 0 0 0 200 100" stroke="blue" fill="none" stroke-width="2" />
  <path d="M 100 100 A 60 60 0 0 1 200 100" stroke="orange" fill="none" stroke-width="2" />
  <path d="M 100 100 A 60 60 0 1 0 200 100" stroke="purple" fill="none" stroke-width="2" />
  <path d="M 100 100 A 60 60 0 1 1 200 100" stroke="teal" fill="none" stroke-width="2" />
</svg>

### Visual Guide

```
large-arc=0, sweep=0 : Small arc, curves upward (CCW)
large-arc=0, sweep=1 : Small arc, curves downward (CW)
large-arc=1, sweep=0 : Large arc, curves downward (CCW)
large-arc=1, sweep=1 : Large arc, curves upward (CW)
```

---

## Circles

A full circle requires two arcs (you can't draw a circle with one arc command because start and end would be the same):

```svg
<path d="M 150 100
         A 50 50 0 1 1 150 100.001
         A 50 50 0 1 1 150 100"
      fill="none" stroke="black" stroke-width="2" />
```

Or more elegantly:

```svg
<path d="M 100 50
         A 50 50 0 1 0 100 150
         A 50 50 0 1 0 100 50"
      fill="coral" />
```

---

## Ellipses

Different rx and ry create ellipses:

```svg
<path d="M 50 100 A 80 40 0 1 1 210 100 A 80 40 0 1 1 50 100"
      fill="steelblue" />
```

---

## Rotated Ellipses

The `x-axis-rotation` parameter tilts the ellipse:

```svg
<svg width="300" height="200">
  <!-- No rotation -->
  <path d="M 50 100 A 60 30 0 1 1 150 100" stroke="gray" fill="none" />

  <!-- 45 degree rotation -->
  <path d="M 150 100 A 60 30 45 1 1 250 100" stroke="coral" fill="none" stroke-width="2" />
</svg>
```

<svg width="300" height="200">
  <path d="M 50 100 A 60 30 0 1 1 150 100" stroke="gray" fill="none" />
  <path d="M 150 100 A 60 30 45 1 1 250 100" stroke="coral" fill="none" stroke-width="2" />
</svg>

---

## Pie Chart Segments

Arcs are perfect for pie charts:

```svg
<svg width="200" height="200" viewBox="-100 -100 200 200">
  <!-- 25% segment (90 degrees) -->
  <path d="M 0 0 L 80 0 A 80 80 0 0 1 0 80 Z" fill="coral" />

  <!-- 25% segment -->
  <path d="M 0 0 L 0 80 A 80 80 0 0 1 -80 0 Z" fill="steelblue" />

  <!-- 50% segment (180 degrees, needs large-arc) -->
  <path d="M 0 0 L -80 0 A 80 80 0 1 1 80 0 Z" fill="gold" />
</svg>
```

<svg width="200" height="200" viewBox="-100 -100 200 200">
  <path d="M 0 0 L 80 0 A 80 80 0 0 1 0 80 Z" fill="coral" />
  <path d="M 0 0 L 0 80 A 80 80 0 0 1 -80 0 Z" fill="steelblue" />
  <path d="M 0 0 L -80 0 A 80 80 0 1 1 80 0 Z" fill="gold" />
</svg>

---

## Rounded Corners

Combine lines and small arcs:

```svg
<path d="M 30 10
         H 170
         A 20 20 0 0 1 190 30
         V 170
         A 20 20 0 0 1 170 190
         H 30
         A 20 20 0 0 1 10 170
         V 30
         A 20 20 0 0 1 30 10
         Z"
      fill="steelblue" />
```

This creates a rounded rectangle!

---

## Progress Rings

A common UI pattern:

```svg
<svg width="120" height="120" viewBox="0 0 120 120">
  <!-- Background ring -->
  <circle cx="60" cy="60" r="50"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="10" />

  <!-- Progress arc (75%) -->
  <path d="M 60 10 A 50 50 0 1 1 10 60"
        fill="none"
        stroke="#3b82f6"
        stroke-width="10"
        stroke-linecap="round" />
</svg>
```

<svg width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="50"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="10" />
  <path d="M 60 10 A 50 50 0 1 1 10 60"
        fill="none"
        stroke="#3b82f6"
        stroke-width="10"
        stroke-linecap="round" />
</svg>

For different percentages, calculate the end point using trigonometry or adjust the flags.

---

## When Arcs Don't Fit

If the radii are too small to reach the endpoint, SVG automatically scales them up. This can cause unexpected results.

```svg
<!-- These radii are too small -->
<path d="M 50 100 A 20 20 0 0 1 150 100" stroke="black" fill="none" />
<!-- SVG scales the ellipse to make it work -->
```

---

## Exercise 8.1: Draw a Semicircle

Create a filled semicircle using a single arc command and the `Z` close path.

## Exercise 8.2: Donut Chart

Create a donut chart with 3 segments:

- Red: 50%
- Blue: 30%
- Green: 20%

Use arcs with appropriate flags.

## Exercise 8.3: Rounded Rectangle Function

Write out the path for a rounded rectangle with:

- Width: 200
- Height: 100
- Corner radius: 15

## Exercise 8.4: Circular Progress

Create a progress ring showing 60% completion.

---

## Key Takeaways

- Arc syntax: `A rx ry rotation large-arc sweep x y`
- Four possible arcs between any two points
- `large-arc-flag`: 0 = smaller arc, 1 = larger arc
- `sweep-flag`: 0 = counter-clockwise, 1 = clockwise
- Full circles need two arc commands
- Great for pie charts, progress rings, rounded corners

---

Next: [Lesson 09: Transforms](/articles/09-transforms)
