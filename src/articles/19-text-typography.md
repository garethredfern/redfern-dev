---
title: "Text & Typography"
description: "Add text to your SVGs with full control over positioning, styling, and even flowing text along curved paths. Learn the text, tspan, and textPath elements."
tags: ["svg"]
pubDate: "2025-12-02T06:00:00Z"
series: "svg-basics"
seriesOrder: 19
---

## Lesson 19: Text & Typography

SVG text isn't just a label slapped on an image — it's a fully styleable, positionable, and animatable graphic element. You can place text precisely, style individual characters, and even flow text along curves.

---

## The `<text>` Element

The basic text element positions text at a specific coordinate:

```svg
<svg width="300" height="100">
  <text x="10" y="50">Hello, SVG!</text>
</svg>
```

The `x` and `y` attributes set the position of the text's **baseline** (the line letters sit on), not the top-left corner.

### Text Attributes

| Attribute           | Description                               |
| ------------------- | ----------------------------------------- |
| `x`, `y`            | Baseline position                         |
| `dx`, `dy`          | Offset from position (useful for nudging) |
| `text-anchor`       | Alignment: `start`, `middle`, `end`       |
| `dominant-baseline` | Vertical alignment                        |

### Centering Text

```svg
<svg width="200" height="100">
  <text x="100" y="50" text-anchor="middle" dominant-baseline="middle">
    Centered
  </text>
</svg>
```

This centers the text both horizontally and vertically at the point (100, 50).

---

## Styling Text with CSS

SVG text accepts most CSS font properties:

```svg
<style>
  .title {
    font-family: Georgia, serif;
    font-size: 24px;
    font-weight: bold;
    fill: #1e293b;
  }
</style>

<text class="title" x="20" y="40">Styled Text</text>
```

Key difference from HTML: use `fill` for text colour, not `color`.

You can also apply `stroke` to create outlined text:

```svg
<text x="20" y="60"
      font-size="48"
      font-weight="bold"
      fill="none"
      stroke="#3b82f6"
      stroke-width="2">
  Outlined
</text>
```

---

## The `<tspan>` Element

Use `<tspan>` to style or position parts of text differently:

```svg
<text x="10" y="50" font-size="20">
  This is <tspan fill="red" font-weight="bold">important</tspan> text.
</text>
```

### Line Breaks with tspan

SVG doesn't have automatic line wrapping. Use `<tspan>` with new coordinates:

```svg
<text x="10" y="30" font-size="16">
  <tspan x="10" y="30">Line one</tspan>
  <tspan x="10" y="50">Line two</tspan>
  <tspan x="10" y="70">Line three</tspan>
</text>
```

Or use `dy` for relative positioning:

```svg
<text x="10" y="30" font-size="16">
  <tspan x="10" dy="0">Line one</tspan>
  <tspan x="10" dy="20">Line two</tspan>
  <tspan x="10" dy="20">Line three</tspan>
</text>
```

### Character-by-Character Positioning

You can position individual characters:

```svg
<text x="10 30 50 70 90" y="50" font-size="20">HELLO</text>
```

Each character gets its own x position. This is useful for creative typography effects.

---

## Text Along a Path

The `<textPath>` element flows text along any path — curves, circles, waves.

```svg
<svg width="300" height="200">
  <defs>
    <path id="curve" d="M 20,100 Q 150,20 280,100" fill="none" />
  </defs>

  <text font-size="16">
    <textPath href="#curve">
      Text flowing along a curve
    </textPath>
  </text>
</svg>
```

### textPath Attributes

| Attribute     | Description                                 |
| ------------- | ------------------------------------------- |
| `href`        | Reference to the path (use `#id`)           |
| `startOffset` | Where along the path to start (length or %) |
| `method`      | `align` (default) or `stretch`              |
| `spacing`     | `auto` (default) or `exact`                 |

### Centered Text on a Path

```svg
<text font-size="16" text-anchor="middle">
  <textPath href="#curve" startOffset="50%">
    Centered on curve
  </textPath>
</text>
```

### Circular Text

```svg
<defs>
  <path id="circle-path"
        d="M 100,50 A 50,50 0 1,1 99.99,50"
        fill="none" />
</defs>

<text font-size="12">
  <textPath href="#circle-path">
    Text going around in a circle • Text going around in a circle •
  </textPath>
</text>
```

---

## Animating Text

Text can be animated like any SVG element:

```svg
<text x="100" y="50" text-anchor="middle" font-size="24">
  Pulsing
  <animate attributeName="font-size" values="24;32;24" dur="1s" repeatCount="indefinite" />
</text>
```

### Animated Text Along Path

```svg
<text font-size="14">
  <textPath href="#curve">
    Scrolling text message...
    <animate attributeName="startOffset" from="0%" to="100%" dur="5s" repeatCount="indefinite" />
  </textPath>
</text>
```

---

## Practical Examples

### Badge with Text

```svg
<svg width="100" height="100">
  <circle cx="50" cy="50" r="45" fill="#3b82f6" />
  <text x="50" y="50"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        font-size="14"
        font-weight="bold">
    NEW
  </text>
</svg>
```

### Multi-line Caption

```svg
<text x="10" y="20" font-size="14" fill="#64748b">
  <tspan x="10" dy="0" font-weight="bold" fill="#1e293b">Figure 1</tspan>
  <tspan x="10" dy="18">Sales growth over</tspan>
  <tspan x="10" dy="16">the past quarter</tspan>
</text>
```

### Wavy Text

```svg
<defs>
  <path id="wave" d="M 0,30 Q 25,10 50,30 T 100,30 T 150,30 T 200,30" fill="none" />
</defs>

<text font-size="20" font-weight="bold" fill="#8b5cf6">
  <textPath href="#wave">Wavy Text Effect</textPath>
</text>
```

---

## Exercises

### Exercise 19.1: Styled Heading

Create a large heading with a gradient fill. (Hint: define a gradient and use `fill="url(#gradient-id)"`.)

### Exercise 19.2: Two-Line Label

Create a label with a bold title on line one and a lighter description on line two, vertically spaced with `<tspan>`.

### Exercise 19.3: Circular Badge

Create text that flows around the top of a circle, like a logo badge.

### Exercise 19.4: Animated Marquee

Create text that scrolls along a path continuously using `<animate>` on `startOffset`.

---

## Key Takeaways

- Position text with `x`, `y` (baseline position) and align with `text-anchor`
- Use `<tspan>` for inline styling and manual line breaks
- SVG has no auto line-wrap — you control every line
- `<textPath>` flows text along any path (curves, circles, waves)
- Use `fill` for text colour, `stroke` for outlined text
- Text can be animated like any other SVG element

---

Next: [Lesson 20: Symbols & Reuse](/articles/20-symbols-reuse)
