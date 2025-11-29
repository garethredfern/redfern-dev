---
title: "Basic SVG Shapes?"
description: "Learn about the fundamental SVG shapes — rectangles, circles, ellipses, lines, and polygons. Master the building blocks of SVG graphics."
tags: ["svg"]
pubDate: "2025-11-28T09:00:00.000Z"
link: "02-basic-shapes"
---

## Lesson 02: Basic Shapes

SVG gives you a set of primitive shapes to work with. These are your building blocks — most SVG illustrations are just clever combinations of these simple elements.

---

## Rectangle: `<rect>`

The most straightforward shape. Four sides, right angles.

```svg
<svg width="200" height="150">
  <rect x="20" y="20" width="160" height="110" fill="steelblue" />
</svg>
```

<svg width="200" height="150">
  <rect x="20" y="20" width="160" height="110" fill="steelblue" />
</svg>

### Attributes

| Attribute | Description                                        |
| --------- | -------------------------------------------------- |
| `x`       | Distance from left edge to rectangle's left side   |
| `y`       | Distance from top edge to rectangle's top side     |
| `width`   | How wide the rectangle is                          |
| `height`  | How tall the rectangle is                          |
| `rx`      | Corner radius (horizontal) — makes rounded corners |
| `ry`      | Corner radius (vertical) — usually same as rx      |

### Rounded Corners

Add `rx` and `ry` to soften the corners:

```svg
<svg width="200" height="150">
  <rect x="20" y="20" width="160" height="110" rx="15" ry="15" fill="steelblue" />
</svg>
```

<svg width="200" height="150">
  <rect x="20" y="20" width="160" height="110" rx="15" ry="15" fill="steelblue" />
</svg>

If you only specify `rx`, the `ry` defaults to match it:

```svg
<rect x="20" y="20" width="160" height="110" rx="15" fill="steelblue" />
```

---

## Circle: `<circle>`

A perfect circle, defined by its center point and radius.

```svg
<svg width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="coral" />
</svg>
```

<svg width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="coral" />
</svg>

### Attributes

| Attribute | Description                           |
| --------- | ------------------------------------- |
| `cx`      | X coordinate of the center            |
| `cy`      | Y coordinate of the center            |
| `r`       | Radius (distance from center to edge) |

Note: Unlike `<rect>`, a circle is positioned by its **center**, not its top-left corner.

---

## Ellipse: `<ellipse>`

Like a circle, but you can stretch it horizontally or vertically.

```svg
<svg width="200" height="150">
  <ellipse cx="100" cy="75" rx="80" ry="50" fill="mediumpurple" />
</svg>
```

<svg width="200" height="150">
  <ellipse cx="100" cy="75" rx="80" ry="50" fill="mediumpurple" />
</svg>

### Attributes

| Attribute | Description                |
| --------- | -------------------------- |
| `cx`      | X coordinate of the center |
| `cy`      | Y coordinate of the center |
| `rx`      | Horizontal radius          |
| `ry`      | Vertical radius            |

If `rx` equals `ry`, you've got a circle.

---

## Line: `<line>`

A straight line between two points.

```svg
<svg width="200" height="200">
  <line x1="20" y1="20" x2="180" y2="180" stroke="red" stroke-width="2" />
</svg>
```

<svg width="200" height="200">
  <line x1="20" y1="20" x2="180" y2="180" stroke="red" stroke-width="2" />
</svg>

### Attributes

| Attribute | Description                        |
| --------- | ---------------------------------- |
| `x1`      | X coordinate of the starting point |
| `y1`      | Y coordinate of the starting point |
| `x2`      | X coordinate of the ending point   |
| `y2`      | Y coordinate of the ending point   |

**Important:** Lines have no fill — they only have a stroke. If you don't add a `stroke` attribute, you won't see anything!

---

## Polyline: `<polyline>`

A series of connected straight lines. Like connect-the-dots.

```svg
<svg width="200" height="200">
  <polyline
    points="20,180 60,60 100,140 140,40 180,120"
    fill="none"
    stroke="teal"
    stroke-width="3"
  />
</svg>
```

<svg width="200" height="200">
  <polyline
    points="20,180 60,60 100,140 140,40 180,120"
    fill="none"
    stroke="teal"
    stroke-width="3"
  />
</svg>

### Attributes

| Attribute | Description                                   |
| --------- | --------------------------------------------- |
| `points`  | A list of x,y coordinates separated by spaces |

The format for `points` is: `x1,y1 x2,y2 x3,y3 ...`

By default, polylines are filled (connecting the last point to the first). Set `fill="none"` if you just want the line.

---

## Polygon: `<polygon>`

Like polyline, but it automatically closes — the last point connects back to the first.

```svg
<svg width="200" height="200">
  <polygon
    points="100,20 180,180 20,180"
    fill="gold"
    stroke="orange"
    stroke-width="3"
  />
</svg>
```

<svg width="200" height="200">
  <polygon
    points="100,20 180,180 20,180"
    fill="gold"
    stroke="orange"
    stroke-width="3"
  />
</svg>

This creates a triangle. The three points define the three corners.

### Common Polygons

**Triangle (3 points):**

```svg
<polygon points="100,20 180,180 20,180" fill="tomato" />
```

**Pentagon (5 points):**

```svg
<polygon points="100,10 190,75 160,180 40,180 10,75" fill="dodgerblue" />
```

**Star (10 points — alternating outer and inner):**

```svg
<polygon
  points="100,10 120,70 180,70 130,110 150,170 100,130 50,170 70,110 20,70 80,70"
  fill="gold"
/>
```

---

## Understanding Draw Order

SVGs are painted in **document order**. Elements that come later in the code are drawn on top of earlier elements.

```svg
<svg width="200" height="200">
  <!-- This circle is drawn first (behind) -->
  <circle cx="80" cy="100" r="60" fill="blue" />

  <!-- This circle is drawn second (in front) -->
  <circle cx="120" cy="100" r="60" fill="red" />
</svg>
```

The red circle overlaps the blue one because it comes later in the markup.

To change the stacking order, change the order of elements in your SVG code.

---

## The `<g>` Element: Grouping Shapes

The `<g>` element groups multiple shapes together. It's like a `<div>` in HTML.

```svg
<svg width="200" height="200">
  <g fill="purple" stroke="black" stroke-width="2">
    <circle cx="50" cy="100" r="30" />
    <circle cx="100" cy="100" r="30" />
    <circle cx="150" cy="100" r="30" />
  </g>
</svg>
```

Why group?

1. **Apply shared styles** — Set `fill` once on the group instead of each shape
2. **Transform together** — Rotate or move the entire group as one unit
3. **Organisation** — Keep related shapes together in your code

---

## Exercise 2.1: Build a Face

Using only the shapes you've learned, create a simple face:

- A large circle for the head (fill: `peachpuff`)
- Two smaller circles for eyes (fill: `black`)
- An ellipse for the mouth (fill: `tomato`)

## Exercise 2.2: Traffic Light

Create a traffic light:

- A tall rectangle for the housing (fill: `#333`, rounded corners)
- Three circles inside: red, yellow, green (from top to bottom)

## Exercise 2.3: House

Draw a simple house using:

- A rectangle for the main building
- A polygon (triangle) for the roof
- A smaller rectangle for the door
- Two squares for windows

---

## Quick Reference

| Shape        | Key Attributes              | Notes                             |
| ------------ | --------------------------- | --------------------------------- |
| `<rect>`     | x, y, width, height, rx, ry | Positioned by top-left corner     |
| `<circle>`   | cx, cy, r                   | Positioned by center              |
| `<ellipse>`  | cx, cy, rx, ry              | Positioned by center              |
| `<line>`     | x1, y1, x2, y2              | Needs stroke, no fill             |
| `<polyline>` | points                      | Open shape, often use fill="none" |
| `<polygon>`  | points                      | Automatically closes              |
| `<g>`        | —                           | Groups elements together          |

---

## Key Takeaways

- SVG has six basic shape elements plus the grouping element
- Rectangles position from the top-left; circles and ellipses from the center
- Lines need a stroke to be visible
- Polygons auto-close; polylines don't
- Draw order matters — later elements appear on top

---

Next: [Lesson 03: The Coordinate System](/articles/03-coordinate-system)
