---
title: "Responsive SVG"
description: "Make SVGs that scale beautifully across all screen sizes. Master viewBox, preserveAspectRatio, and CSS techniques for fluid, responsive graphics."
tags: ["svg"]
pubDate: "2025-12-02T07:30:00Z"
link: "22-responsive-svg"
---

## Lesson 22: Responsive SVG

SVGs are inherently scalable — that's the "S" in SVG. But making them _responsive_ — adapting intelligently to different containers and screen sizes — requires understanding a few key concepts.

---

## The viewBox is Everything

We covered `viewBox` in Lesson 3, but it's crucial for responsive SVGs:

```svg
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#3b82f6" />
</svg>
```

The `viewBox` defines a coordinate system. The SVG will scale to fit its container while maintaining those internal coordinates.

**Without viewBox**: The SVG has fixed dimensions.
**With viewBox**: The SVG scales fluidly.

---

## Removing Fixed Dimensions

For a fully responsive SVG, remove `width` and `height`:

```svg
<svg viewBox="0 0 200 100">
  <!-- content scales to container -->
</svg>
```

Then control size with CSS:

```css
svg {
  width: 100%;
  height: auto;
}
```

The SVG now fills its container width and calculates height from the viewBox aspect ratio (2:1 in this case).

---

## preserveAspectRatio

This attribute controls how the viewBox fits into the SVG's actual dimensions:

```svg
<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
```

### Alignment Values

The first part (`xMidYMid`) sets alignment:

| Value      | X Alignment | Y Alignment |
| ---------- | ----------- | ----------- |
| `xMinYMin` | Left        | Top         |
| `xMidYMin` | Center      | Top         |
| `xMaxYMin` | Right       | Top         |
| `xMinYMid` | Left        | Middle      |
| `xMidYMid` | Center      | Middle      |
| `xMaxYMid` | Right       | Middle      |
| `xMinYMax` | Left        | Bottom      |
| `xMidYMax` | Center      | Bottom      |
| `xMaxYMax` | Right       | Bottom      |

### Meet vs Slice

The second part controls scaling:

**meet** (default) — Scale to fit entirely within the viewport (like `background-size: contain`)

```svg
<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
```

**slice** — Scale to cover the viewport, cropping if needed (like `background-size: cover`)

```svg
<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice">
```

### none

Stretch to fill, ignoring aspect ratio:

```svg
<svg viewBox="0 0 100 50" preserveAspectRatio="none">
```

Use sparingly — this distorts the graphic.

---

## Common Responsive Patterns

### Full-Width Banner

```svg
<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
  <!-- hero graphic that fills width and crops height -->
</svg>
```

```css
.banner svg {
  width: 100%;
  height: 200px;
}
```

### Centered Icon

```svg
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
  <!-- icon stays centered and contained -->
</svg>
```

### Fluid Illustration

```html
<div class="illustration-container">
  <svg viewBox="0 0 800 600">
    <!-- illustration scales proportionally -->
  </svg>
</div>
```

```css
.illustration-container {
  max-width: 800px;
  width: 100%;
}

.illustration-container svg {
  width: 100%;
  height: auto;
}
```

---

## CSS Sizing Techniques

### Percentage Width

```css
svg {
  width: 50%;
  height: auto;
}
```

### Fixed Height, Fluid Width

```css
svg {
  width: 100%;
  height: 60px;
}
```

Combine with `preserveAspectRatio` to control cropping/fitting.

### Viewport Units

```css
svg {
  width: 50vw;
  height: 50vh;
}
```

### Container Queries (Modern CSS)

```css
@container (min-width: 600px) {
  svg {
    width: 400px;
  }
}
```

---

## Inline SVG vs img Tag

### Inline SVG

```html
<div class="hero">
  <svg viewBox="0 0 800 400">...</svg>
</div>
```

```css
.hero svg {
  width: 100%;
  height: auto;
}
```

✅ Full CSS control
✅ Can be styled/animated
✅ Responsive by default with viewBox

### img Tag

```html
<img src="graphic.svg" alt="Description" class="responsive-svg" />
```

```css
.responsive-svg {
  width: 100%;
  height: auto;
  max-width: 600px;
}
```

✅ Cached separately
✅ Simpler HTML
❌ Limited CSS access

### CSS Background

```css
.hero {
  background-image: url("graphic.svg");
  background-size: cover;
  background-position: center;
}
```

✅ Easy positioning
❌ No DOM access
❌ Less accessible

---

## Responsive Breakpoint Strategies

### Swap SVGs at Breakpoints

```html
<picture>
  <source media="(min-width: 768px)" srcset="graphic-large.svg" />
  <img src="graphic-small.svg" alt="Description" />
</picture>
```

### Hide/Show Elements Within SVG

```svg
<svg viewBox="0 0 400 200">
  <g class="mobile-only">
    <!-- simplified version -->
  </g>
  <g class="desktop-only">
    <!-- detailed version -->
  </g>
</svg>
```

```css
.desktop-only {
  display: none;
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
  .desktop-only {
    display: block;
  }
}
```

### Adjust Content Based on Size

```svg
<svg viewBox="0 0 100 100">
  <text class="label-full">Dashboard</text>
  <text class="label-short">Dash</text>
</svg>
```

```css
.label-short {
  display: none;
}

@media (max-width: 480px) {
  .label-full {
    display: none;
  }
  .label-short {
    display: block;
  }
}
```

---

## Aspect Ratio Control

### CSS aspect-ratio Property

```css
.svg-container {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.svg-container svg {
  width: 100%;
  height: 100%;
}
```

### Padding Hack (Legacy)

For older browser support:

```css
.svg-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 ratio */
  height: 0;
}

.svg-container svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

---

## Practical Example: Responsive Logo

```svg
<svg viewBox="0 0 200 60" class="logo" aria-label="Company Name">
  <!-- Icon part -->
  <g class="logo-icon">
    <circle cx="30" cy="30" r="25" fill="#3b82f6" />
  </g>

  <!-- Text part - hidden on mobile -->
  <g class="logo-text">
    <text x="70" y="38" font-size="24" font-weight="bold" fill="#1e293b">
      Company
    </text>
  </g>
</svg>
```

```css
.logo {
  height: 40px;
  width: auto;
}

@media (max-width: 480px) {
  .logo {
    height: 32px;
  }

  .logo-text {
    display: none;
  }
}
```

On mobile, only the icon shows. On larger screens, the full logo appears.

---

## Exercises

### Exercise 22.1: Fluid Hero

Create an SVG that spans the full width of the page and maintains a 3:1 aspect ratio.

### Exercise 22.2: preserveAspectRatio Test

Create a simple SVG and test all combinations of `xMinYMin`, `xMidYMid`, `xMaxYMax` with `meet` and `slice`.

### Exercise 22.3: Responsive Icon Set

Create a navigation bar with SVG icons that scale proportionally as the viewport changes.

### Exercise 22.4: Breakpoint Swap

Create an SVG with detail elements that hide on smaller screens using CSS media queries.

---

## Key Takeaways

- Always include `viewBox` for responsive SVGs
- Remove fixed `width`/`height` and control size with CSS
- `preserveAspectRatio` controls how content fits: `meet` (contain), `slice` (cover), `none` (stretch)
- Use CSS media queries to show/hide SVG elements at breakpoints
- Inline SVGs offer the most control; `<img>` tags are simpler
- Modern CSS `aspect-ratio` simplifies container sizing

---

Next: [Lesson 23: SVG + JavaScript](/articles/23-svg-javascript)
