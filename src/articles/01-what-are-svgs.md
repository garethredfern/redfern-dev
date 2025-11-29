---
title: "What Are SVGs?"
description: "An introduction to Scalable Vector Graphics (SVGs) — learn what they are, why they're useful, and how to use them in your web projects."
tags: ["svg"]
published: "2025-11-28"
permalink: "01-what-are-svgs"
---

## Lesson 01: What Are SVGs?

An introduction to Scalable Vector Graphics (SVGs) — learn what they are, why they're useful, and how to use them in your web projects.

## The Two Types of Images

When you display an image on a screen, there are fundamentally two approaches:

**Raster images** (JPG, PNG, GIF) store a grid of pixels. Each pixel has a colour value. When you zoom in, you eventually see the individual pixels — the image becomes blocky and blurry.

**Vector images** (SVG) store mathematical descriptions of shapes. A circle isn't stored as pixels — it's stored as "a circle at position X,Y with radius R". When you zoom in, the browser recalculates and redraws the shape at the new size. It stays crisp forever.

## What Does SVG Stand For?

**S**calable **V**ector **G**raphics

The "scalable" part is the key benefit — SVGs look sharp at any size, from a tiny icon to a billboard.

## SVG is Just XML

Here's the thing that makes SVGs special for web developers: **SVG is a markup language**, just like HTML.

Look at this SVG:

```svg
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="tomato" />
</svg>
```

That's it. That's a red circle. No image editor required — you can write SVGs by hand.

Compare that to HTML:

```html
<div>
  <p>Hello world</p>
</div>
```

Same idea. Tags, attributes, nesting. If you know HTML, you already understand the syntax.

## Why Use SVGs?

**1. Resolution Independence**
They look perfect on retina displays, 4K monitors, or when users zoom in. No need for @2x or @3x image variants.

**2. Small File Size**
Simple icons and illustrations are often smaller as SVGs than as PNGs. A basic icon might be 500 bytes as SVG versus 5KB as PNG.

**3. Styleable with CSS**
You can change colours, add hover effects, and animate SVGs using the CSS you already know.

**4. Scriptable with JavaScript**
SVG elements are part of the DOM. You can select them with `querySelector`, add event listeners, and manipulate them dynamically.

**5. Accessible**
You can add titles, descriptions, and ARIA attributes to make SVGs meaningful for screen readers.

## When NOT to Use SVGs

SVGs aren't the right choice for everything:

- **Photographs** — Use JPG. SVGs can't efficiently represent complex photographic detail.
- **Highly detailed illustrations** — If an illustration has thousands of tiny shapes, the SVG file might actually be larger than a raster equivalent.
- **When you need pixel-perfect control** — SVGs are resolution-independent, which means you don't control individual pixels.

## Embedding SVGs in HTML

There are two ways to get SVGs onto your webpage:

### Inline SVG

Paste the SVG code directly into your HTML:

```html
<body>
  <h1>My Page</h1>
  <svg width="100" height="100">
    <circle cx="50" cy="50" r="40" fill="blue" />
  </svg>
</body>
```

**Pros:** Full CSS and JavaScript access, no extra HTTP request
**Cons:** Clutters your HTML, can't be cached separately

### External SVG

Reference the SVG as an image file:

```html
<img src="circle.svg" alt="A blue circle" />
```

Or in CSS:

```css
.icon {
  background-image: url("circle.svg");
}
```

**Pros:** Cleaner HTML, browser can cache the file
**Cons:** Limited CSS access, can't use JavaScript on it

When using an external SVG, you need to add the `xmlns` attribute:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
```

This tells the browser "this is an SVG file" when it's loaded standalone.

## Your First SVG

Let's create a simple SVG step by step.

Create a file called `first.svg` and add:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <rect x="50" y="50" width="100" height="100" fill="cornflowerblue" />
</svg>
```

Open it in your browser. You should see a blue square.

Now let's break down what each part means:

| Code                    | Meaning                                                 |
| ----------------------- | ------------------------------------------------------- |
| `<svg>`                 | The root element — every SVG starts with this           |
| `xmlns="..."`           | Declares this as an SVG (required for standalone files) |
| `width="200"`           | The SVG is 200 pixels wide                              |
| `height="200"`          | The SVG is 200 pixels tall                              |
| `<rect>`                | A rectangle shape                                       |
| `x="50"`                | The rectangle starts 50 pixels from the left            |
| `y="50"`                | The rectangle starts 50 pixels from the top             |
| `width="100"`           | The rectangle is 100 pixels wide                        |
| `height="100"`          | The rectangle is 100 pixels tall                        |
| `fill="cornflowerblue"` | The fill colour                                         |

---

## Exercise 1.1: Modify the Square

Take the SVG above and make these changes:

1. Change the fill colour to `tomato`
2. Move the rectangle to the top-left corner (x=0, y=0)
3. Make the rectangle twice as wide (200 pixels)

## Exercise 1.2: Add a Second Shape

Add a circle on top of your rectangle. The circle should:

- Be centered at x=100, y=100
- Have a radius of 30
- Be filled with `gold`

Hint: Use the `<circle>` element with `cx`, `cy`, and `r` attributes.

---

## Key Takeaways

- SVGs are vector images — they scale infinitely without losing quality
- SVG is a markup language, similar to HTML
- You can embed SVGs inline or reference them externally
- SVGs can be styled with CSS and manipulated with JavaScript

---

Next: [Lesson 02: Basic Shapes](/articles/02-basic-shapes)
