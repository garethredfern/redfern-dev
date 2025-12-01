---
title: "Masks & Clip Paths"
description: "Control visibility with clip paths for hard edges and masks for soft transparency. Create reveal effects, spotlight animations, and complex composite shapes."
tags: ["svg"]
pubDate: "2025-12-01T09:30:00Z"
link: "17-masks-clip-paths"
---

## Lesson 17: Masks & Clip Paths

Both masks and clip paths control what's visible, but they work differently:

- **Clip paths** — Hard edges. Content is either fully visible or fully hidden.
- **Masks** — Soft edges. Content can be partially transparent based on the mask's luminance or alpha.

---

## Clip Paths

A clip path defines a shape. Only the parts of an element inside that shape are visible.

```svg
<svg width="200" height="200">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="100" cy="100" r="80" />
    </clipPath>
  </defs>

  <!-- This image is clipped to a circle -->
  <image href="photo.jpg" width="200" height="200" clip-path="url(#circle-clip)" />
</svg>
```

### How It Works

1. Define a `<clipPath>` containing shapes
2. Apply it with `clip-path="url(#id)"`
3. Only content inside the shapes is rendered

The shapes inside `<clipPath>` aren't rendered — they just define the clipping region.

### Multiple Shapes

You can combine shapes in a clip path:

```svg
<defs>
  <clipPath id="two-circles">
    <circle cx="70" cy="100" r="50" />
    <circle cx="130" cy="100" r="50" />
  </clipPath>
</defs>

<rect width="200" height="200" fill="coral" clip-path="url(#two-circles)" />
```

### Clip Path with Text

Text can be a clip path too:

```svg
<defs>
  <clipPath id="text-clip">
    <text x="100" y="120" font-size="80" font-weight="bold" text-anchor="middle">
      SVG
    </text>
  </clipPath>
</defs>

<!-- Gradient clipped to text shape -->
<rect width="200" height="200" fill="url(#rainbow)" clip-path="url(#text-clip)" />
```

### clipPathUnits

Controls how coordinates inside the clip path are interpreted:

**userSpaceOnUse** (default) — Coordinates match the SVG coordinate system.

**objectBoundingBox** — Coordinates are fractions (0-1) of the element being clipped.

```svg
<clipPath id="responsive-clip" clipPathUnits="objectBoundingBox">
  <!-- This circle is always centered, regardless of element size -->
  <circle cx="0.5" cy="0.5" r="0.4" />
</clipPath>
```

---

## CSS clip-path

You can also use CSS `clip-path` with basic shapes:

```css
.clipped {
  clip-path: circle(50%);
  clip-path: ellipse(50% 30% at center);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  clip-path: inset(10px 20px 30px 40px round 10px);
}
```

Or reference an SVG clip path:

```css
.clipped {
  clip-path: url(#my-clip-path);
}
```

---

## Masks

Masks use luminance (brightness) or alpha (transparency) to control visibility. Brighter areas in the mask = more visible content.

```svg
<svg width="200" height="200">
  <defs>
    <mask id="fade-mask">
      <rect width="200" height="200" fill="url(#fade-gradient)" />
    </mask>

    <linearGradient id="fade-gradient">
      <stop offset="0%" stop-color="white" />
      <stop offset="100%" stop-color="black" />
    </linearGradient>
  </defs>

  <rect width="200" height="200" fill="coral" mask="url(#fade-mask)" />
</svg>
```

### How Masks Work

- **White** (luminance 100%) = fully visible
- **Black** (luminance 0%) = fully hidden
- **Grey** = partially transparent

This is different from clip paths, which are binary (visible or not).

### Mask with Gradients

Gradients create smooth transitions:

```svg
<defs>
  <radialGradient id="spotlight">
    <stop offset="0%" stop-color="white" />
    <stop offset="100%" stop-color="black" />
  </radialGradient>

  <mask id="spotlight-mask">
    <rect width="200" height="200" fill="black" />
    <circle cx="100" cy="100" r="60" fill="url(#spotlight)" />
  </mask>
</defs>

<image href="photo.jpg" width="200" height="200" mask="url(#spotlight-mask)" />
```

This creates a spotlight effect — the image fades out from the center.

### Alpha vs Luminance

Masks can use either:

**luminance** (default) — Brightness of the mask determines visibility.

**alpha** — Transparency of the mask determines visibility.

```svg
<mask id="alpha-mask" mask-type="alpha">
  <!-- Now the alpha channel matters, not brightness -->
</mask>
```

With alpha mode, a semi-transparent white shape creates semi-visible content.

---

## Practical Examples

### Circular Image Crop

```svg
<defs>
  <clipPath id="avatar-clip">
    <circle cx="50" cy="50" r="50" />
  </clipPath>
</defs>

<image href="profile.jpg" width="100" height="100" clip-path="url(#avatar-clip)" />
```

### Text Reveal Animation

Animate a clip path to reveal text:

```svg
<defs>
  <clipPath id="reveal-clip">
    <rect x="0" y="0" width="0" height="100">
      <animate attributeName="width" from="0" to="200" dur="2s" fill="freeze" />
    </rect>
  </clipPath>
</defs>

<text x="100" y="60" text-anchor="middle" font-size="40" clip-path="url(#reveal-clip)">
  REVEAL
</text>
```

### Spotlight Following Mouse (conceptual)

```svg
<defs>
  <radialGradient id="spot">
    <stop offset="0%" stop-color="white" />
    <stop offset="70%" stop-color="white" />
    <stop offset="100%" stop-color="black" />
  </radialGradient>

  <mask id="spotlight">
    <rect width="100%" height="100%" fill="black" />
    <circle id="spot-circle" cx="100" cy="100" r="80" fill="url(#spot)" />
  </mask>
</defs>

<g mask="url(#spotlight)">
  <!-- Hidden content revealed by spotlight -->
</g>
```

Then use JavaScript to move `#spot-circle` with the mouse.

### Vignette Effect

```svg
<defs>
  <radialGradient id="vignette-grad">
    <stop offset="0%" stop-color="white" />
    <stop offset="60%" stop-color="white" />
    <stop offset="100%" stop-color="black" />
  </radialGradient>

  <mask id="vignette">
    <rect width="100%" height="100%" fill="url(#vignette-grad)" />
  </mask>
</defs>

<image href="photo.jpg" width="400" height="300" mask="url(#vignette)" />
```

### Combining Shapes with Clip Paths

Create complex shapes by combining primitives:

```svg
<defs>
  <clipPath id="keyhole">
    <circle cx="100" cy="60" r="40" />
    <rect x="85" y="60" width="30" height="80" />
  </clipPath>
</defs>

<rect width="200" height="200" fill="#1a1a2e" clip-path="url(#keyhole)" />
```

---

## Masks vs Clip Paths: When to Use Which

| Feature     | Clip Path        | Mask                           |
| ----------- | ---------------- | ------------------------------ |
| Edge type   | Hard             | Soft (can fade)                |
| Based on    | Shape geometry   | Luminance/alpha                |
| Gradients   | No effect        | Create fades                   |
| Performance | Generally faster | More complex                   |
| Use case    | Cropping, shapes | Fades, spotlights, compositing |

**Use clip paths for:**

- Cropping images to shapes
- Creating non-rectangular boundaries
- Binary visibility (show/hide)

**Use masks for:**

- Fade effects
- Spotlight/vignette
- Complex transparency
- Soft edges

---

## Animating Masks and Clips

Both can be animated:

```svg
<!-- Animated clip path -->
<clipPath id="growing-circle">
  <circle cx="100" cy="100" r="0">
    <animate attributeName="r" from="0" to="100" dur="2s" fill="freeze" />
  </circle>
</clipPath>

<!-- Animated mask -->
<mask id="pulsing-mask">
  <circle cx="100" cy="100" r="50" fill="white">
    <animate attributeName="r" values="30;70;30" dur="2s" repeatCount="indefinite" />
  </circle>
</mask>
```

---

## Exercises

### Exercise 17.1: Circular Avatar

Create an image clipped to a circle, like a profile avatar.

### Exercise 17.2: Text Knockout

Use text as a clip path to show a gradient through letter shapes.

### Exercise 17.3: Spotlight Effect

Create a scene that's mostly dark with a circular spotlight revealing part of it. Bonus: make the spotlight animate or respond to position.

### Exercise 17.4: Wipe Transition

Create a horizontal wipe animation that reveals an image from left to right using an animated clip path.

### Exercise 17.5: Vignette

Apply a vignette effect to a rectangle using a radial gradient mask.

---

## Key Takeaways

- Clip paths create hard-edged visibility boundaries
- Masks use luminance/alpha for soft transparency effects
- Define both in `<defs>`, reference with `url(#id)`
- Clip paths: binary (visible or not)
- Masks: gradient (partially visible)
- Both can contain any SVG shapes
- Both can be animated for reveal effects
- Masks + gradients = fades, spotlights, vignettes

---

Next: [Lesson 18: Filters](/articles/18-filters)
