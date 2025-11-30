---
title: "Introduction to SVG Paths"
description: "Master the SVG path element — the most powerful shape in SVG. Learn how to draw custom shapes, curves, and complex graphics with the path data syntax."
tags: ["svg"]
pubDate: "2025-11-29T13:00:00Z"
link: "05-intro-to-paths"
---

## Lesson 05: Introduction to Paths

The `<path>` element is the most powerful and flexible shape in SVG. Every icon library, every complex illustration, every curved line — they're all paths under the hood.

---

## Why Paths?

Basic shapes like `<circle>` and `<rect>` are convenient but limited. What if you want:

- A curved line that isn't a perfect arc?
- A complex shape that isn't a polygon?
- A shape with holes in it?
- Smooth, organic curves?

That's where `<path>` comes in.

---

## Anatomy of a Path

A path has one special attribute: `d` (for "data"). This contains drawing instructions:

```svg
<svg width="200" height="200">
  <path d="M 10 10 L 190 190" stroke="white" stroke-width="2" fill="none" />
</svg>
```

<svg width="200" height="200">
  <path d="M 10 10 L 190 190" stroke="white" stroke-width="2" fill="none" />
</svg>

This draws a diagonal line. The `d` attribute says:

- `M 10 10` — **M**ove to coordinates (10, 10)
- `L 190 190` — Draw a **L**ine to coordinates (190, 190)

## Path Commands

The `d` attribute is a sequence of **commands**, each followed by coordinates. Think of it as giving directions to a pen:

| Command | Name             | What It Does                      |
| ------- | ---------------- | --------------------------------- |
| `M`     | Move To          | Pick up pen, move to new position |
| `L`     | Line To          | Draw straight line to position    |
| `H`     | Horizontal Line  | Draw horizontal line to X         |
| `V`     | Vertical Line    | Draw vertical line to Y           |
| `Z`     | Close Path       | Draw line back to start           |
| `Q`     | Quadratic Curve  | Curve with one control point      |
| `C`     | Cubic Curve      | Curve with two control points     |
| `S`     | Smooth Cubic     | Smooth continuation of cubic      |
| `T`     | Smooth Quadratic | Smooth continuation of quadratic  |
| `A`     | Arc              | Elliptical arc                    |

We'll cover the basic ones in this lesson and curves in the next.

---

## The Cursor

Imagine an invisible cursor or pen. It starts at (0, 0). Each command either:

- **Moves** the cursor without drawing (M)
- **Draws** from the current position to a new position (L, H, V, etc.)

The cursor remembers where it is. Commands are relative to the current cursor position or specify absolute coordinates.

---

## Move To: M

`M x y` — Move the cursor to (x, y) without drawing anything.

```svg
<path d="M 50 50" />  <!-- Cursor is now at (50, 50) -->
```

Every path starts with an M command. It's like putting your pen down on the paper.

Multiple M commands create separate subpaths:

```svg
<path d="M 10 10 L 50 50 M 100 10 L 150 50" stroke="black" fill="none" />
```

This draws two separate diagonal lines.

---

## Line To: L

`L x y` — Draw a straight line from current position to (x, y).

```svg
<svg width="200" height="200">
  <path d="M 20 20 L 180 20 L 180 180 L 20 180 L 20 20"
        stroke="white" stroke-width="2" fill="none" />
</svg>
```

<svg width="200" height="200">
  <path d="M 20 20 L 180 20 L 180 180 L 20 180 L 20 20"
        stroke="white" stroke-width="2" fill="none" />
</svg>

This draws a square by connecting four points with lines.

---

## Horizontal and Vertical Lines: H, V

Shortcuts when you only need to move in one direction:

- `H x` — Horizontal line to X coordinate (Y stays the same)
- `V y` — Vertical line to Y coordinate (X stays the same)

The square above could be simplified:

```svg
<path d="M 20 20 H 180 V 180 H 20 V 20" stroke="black" fill="none" />
```

Same result, fewer numbers.

---

## Close Path: Z

`Z` — Draw a straight line from current position back to the start of the current subpath.

```svg
<path d="M 20 20 H 180 V 180 H 20 Z" stroke="black" fill="none" />
```

`Z` replaces the final `V 20` — it automatically connects back to where we started (20, 20).

**Important:** Z also affects how corners look when using `stroke-linejoin`. Without Z, the start and end are two separate points that happen to overlap. With Z, they're properly joined.

---

## Uppercase vs Lowercase

Every command has two versions:

- **Uppercase** (M, L, H, V) — Absolute coordinates
- **Lowercase** (m, l, h, v) — Relative to current position

```svg
<!-- Absolute: "go to (100, 100)" -->
<path d="M 50 50 L 100 100" />

<!-- Relative: "go 50 right and 50 down from where you are" -->
<path d="M 50 50 l 50 50" />
```

Both draw the same line, but the second uses relative movement.

Relative commands are useful when:

- You want to repeat a pattern
- You're moving by a fixed amount regardless of position
- The path was generated programmatically

---

## Whitespace and Commas

SVG is flexible about separators. These are all equivalent:

```svg
<path d="M 10 10 L 50 50" />
<path d="M10 10 L50 50" />
<path d="M10,10 L50,50" />
<path d="M10,10L50,50" />
```

Commands can even be omitted when repeated:

```svg
<!-- Explicit -->
<path d="M 10 10 L 50 50 L 90 10 L 130 50" />

<!-- Implicit (L is repeated) -->
<path d="M 10 10 L 50 50 90 10 130 50" />
```

If you provide coordinates after an L without another command, it assumes another L.

---

## Building a Shape: Triangle

Let's draw a triangle step by step:

```svg
<svg width="200" height="200">
  <path d="M 100 20 L 180 180 L 20 180 Z"
        fill="gold" stroke="orange" stroke-width="3" />
</svg>
```

<svg width="200" height="200">
  <path d="M 100 20 L 180 180 L 20 180 Z"
        fill="gold" stroke="orange" stroke-width="3" />
</svg>

1. `M 100 20` — Start at top center
2. `L 180 180` — Line to bottom right
3. `L 20 180` — Line to bottom left
4. `Z` — Close back to start

---

## Building a Shape: Arrow

```svg
<svg width="200" height="100">
  <path d="M 10 50 H 150 L 130 30 M 150 50 L 130 70"
        stroke="white" stroke-width="3" fill="none"
        stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

<svg width="200" height="100">
  <path d="M 10 50 H 150 L 130 30 M 150 50 L 130 70"
        stroke="white" stroke-width="3" fill="none"
        stroke-linecap="round" stroke-linejoin="round" />
</svg>

1. `M 10 50` — Start at left, vertically centered
2. `H 150` — Horizontal line to the right
3. `L 130 30` — Line up for top of arrowhead
4. `M 150 50` — Move back to the tip (without drawing)
5. `L 130 70` — Line down for bottom of arrowhead

---

## Fill Rules

When paths cross themselves, which parts are "inside"?

The `fill-rule` attribute controls this:

```svg
<svg width="300" height="150">
  <!-- Default: nonzero -->
  <path d="M 75 10 L 100 140 L 10 50 L 140 50 L 50 140 Z"
        fill="blue" fill-rule="nonzero" />

  <!-- evenodd creates holes -->
  <path d="M 225 10 L 250 140 L 160 50 L 290 50 L 200 140 Z"
        fill="blue" fill-rule="evenodd" transform="translate(0, 0)" />
</svg>
```

<svg width="300" height="150">
  <path d="M 75 10 L 100 140 L 10 50 L 140 50 L 50 140 Z"
        fill="blue" fill-rule="nonzero" />
  <path d="M 225 10 L 250 140 L 160 50 L 290 50 L 200 140 Z"
        fill="blue" fill-rule="evenodd" transform="translate(0, 0)" />
</svg>

- **nonzero** (default): Fills everything enclosed
- **evenodd**: Alternates filled/unfilled based on crossing count

---

## Practical Example: Checkmark Icon

```svg
<svg viewBox="0 0 24 24" width="48" height="48">
  <path d="M 4 12 L 9 17 L 20 6"
        stroke="green"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none" />
</svg>
```

<svg viewBox="0 0 24 24" width="48" height="48">
  <path d="M 4 12 L 9 17 L 20 6"
        stroke="green"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none" />
</svg>

Simple! Three points, two lines.

---

## Exercise 5.1: Draw a Plus Sign

Using only M, L (or H, V), create a plus sign (+) centered in a 100×100 viewBox.

Hint: You'll need two subpaths (two M commands).

## Exercise 5.2: Draw a House Outline

Create a simple house shape:

- Square base
- Triangular roof
- Use a single path with Z to close

## Exercise 5.3: Relative vs Absolute

Draw a staircase pattern using:

1. First with absolute coordinates
2. Then with relative coordinates

Which is cleaner?

---

## Key Takeaways

- Paths use the `d` attribute with drawing commands
- Commands: M (move), L (line), H (horizontal), V (vertical), Z (close)
- Uppercase = absolute, lowercase = relative
- Paths can have multiple subpaths (multiple M commands)
- Z closes the path and creates proper joins

---

Next: [Lesson 06: Lines and Movement](/articles/06-lines-and-movement)
