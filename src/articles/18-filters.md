---
title: "SVG Filters"
description: "Apply visual effects like blur, drop shadows, colour manipulation, and more using SVG's powerful filter primitives. Chain effects together for complex visual treatments."
tags: ["svg"]
pubDate: "2025-12-01T10:00:00Z"
link: "18-filters"
---

## Lesson 18: Filters

SVG filters are like Photoshop effects you can apply with code. Blur, drop shadows, colour adjustments, lighting effects — all declarative and animatable.

---

## Basic Filter Structure

Filters are defined in `<defs>` and applied with the `filter` attribute:

```svg
<svg width="200" height="200">
  <defs>
    <filter id="blur-filter">
      <feGaussianBlur stdDeviation="5" />
    </filter>
  </defs>

  <circle cx="100" cy="100" r="50" fill="coral" filter="url(#blur-filter)" />
</svg>
```

### Filter Primitives

Filter effects are called "primitives" and start with `fe` (filter effect):

| Primitive            | Effect                               |
| -------------------- | ------------------------------------ |
| `feGaussianBlur`     | Blur                                 |
| `feDropShadow`       | Drop shadow                          |
| `feColorMatrix`      | Colour manipulation                  |
| `feOffset`           | Move the image                       |
| `feBlend`            | Blend two images                     |
| `feComposite`        | Combine images                       |
| `feMorphology`       | Erode or dilate                      |
| `feConvolveMatrix`   | Custom convolution (sharpen, emboss) |
| `feTurbulence`       | Generate noise                       |
| `feDisplacementMap`  | Distort based on another image       |
| `feDiffuseLighting`  | Diffuse lighting                     |
| `feSpecularLighting` | Specular highlights                  |

---

## Common Filters

### Gaussian Blur

```svg
<filter id="blur">
  <feGaussianBlur stdDeviation="5" />
</filter>
```

`stdDeviation` controls blur amount. Use two values for different X/Y blur: `stdDeviation="5 2"`.

### Drop Shadow

The easy way (SVG2):

```svg
<filter id="shadow">
  <feDropShadow dx="3" dy="3" stdDeviation="2" flood-color="rgba(0,0,0,0.5)" />
</filter>
```

The manual way (better browser support):

```svg
<filter id="shadow-manual">
  <!-- Blur the source -->
  <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
  <!-- Offset it -->
  <feOffset in="blur" dx="3" dy="3" result="shadow" />
  <!-- Layer original on top -->
  <feMerge>
    <feMergeNode in="shadow" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

### Glow Effect

```svg
<filter id="glow">
  <feGaussianBlur stdDeviation="4" result="blur" />
  <feMerge>
    <feMergeNode in="blur" />
    <feMergeNode in="blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

Stacking blurred copies intensifies the glow.

### Coloured Glow

```svg
<filter id="colored-glow">
  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
  <feFlood flood-color="#a855f7" result="color" />
  <feComposite in="color" in2="blur" operator="in" result="colored-blur" />
  <feMerge>
    <feMergeNode in="colored-blur" />
    <feMergeNode in="colored-blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

---

## Filter Inputs and Outputs

Filters can be chained. Use `in` to specify input and `result` to name the output:

```svg
<filter id="chained">
  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blurred" />
  <feOffset in="blurred" dx="5" dy="5" result="offset" />
  <feBlend in="SourceGraphic" in2="offset" mode="multiply" />
</filter>
```

### Built-in Inputs

| Input             | Description                     |
| ----------------- | ------------------------------- |
| `SourceGraphic`   | The original element            |
| `SourceAlpha`     | Alpha channel only (silhouette) |
| `BackgroundImage` | What's behind the element       |
| `BackgroundAlpha` | Alpha of what's behind          |
| `FillPaint`       | The fill colour                 |
| `StrokePaint`     | The stroke colour               |

---

## Colour Manipulation

### feColorMatrix

The most powerful colour tool. Transforms RGBA values with a matrix:

```svg
<filter id="grayscale">
  <feColorMatrix type="saturate" values="0" />
</filter>

<filter id="sepia">
  <feColorMatrix type="matrix"
    values="0.393 0.769 0.189 0 0
            0.349 0.686 0.168 0 0
            0.272 0.534 0.131 0 0
            0     0     0     1 0" />
</filter>
```

**type="saturate"** — values 0-1 (0 = grayscale, 1 = normal)

**type="hueRotate"** — values in degrees

**type="matrix"** — 5x4 matrix for full control

### Quick Colour Effects

```svg
<!-- Grayscale -->
<feColorMatrix type="saturate" values="0" />

<!-- Boost saturation -->
<feColorMatrix type="saturate" values="2" />

<!-- Rotate hue 90 degrees -->
<feColorMatrix type="hueRotate" values="90" />

<!-- Invert colours -->
<feColorMatrix type="matrix"
  values="-1 0 0 0 1
           0 -1 0 0 1
           0 0 -1 0 1
           0 0 0 1 0" />
```

---

## Morphology

Expand or shrink shapes:

```svg
<!-- Dilate (expand) -->
<filter id="thicken">
  <feMorphology operator="dilate" radius="2" />
</filter>

<!-- Erode (shrink) -->
<filter id="thin">
  <feMorphology operator="erode" radius="2" />
</filter>
```

Great for creating outlines:

```svg
<filter id="outline">
  <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="expanded" />
  <feFlood flood-color="black" result="color" />
  <feComposite in="color" in2="expanded" operator="in" result="outline" />
  <feMerge>
    <feMergeNode in="outline" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

---

## Noise and Texture

### feTurbulence

Generates Perlin noise:

```svg
<filter id="noise">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" />
</filter>
```

**type** — `turbulence` or `fractalNoise`

**baseFrequency** — Scale of the noise (smaller = larger features)

**numOctaves** — Detail levels (more = finer detail, slower)

### Textured Fill

Combine with colour:

```svg
<filter id="paper-texture">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
  <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="2" result="lit">
    <feDistantLight azimuth="45" elevation="60" />
  </feDiffuseLighting>
  <feBlend in="SourceGraphic" in2="lit" mode="multiply" />
</filter>
```

---

## Displacement

Warp an image based on another image:

```svg
<filter id="wavy">
  <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" />
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="20"
                      xChannelSelector="R" yChannelSelector="G" />
</filter>
```

The noise texture displaces pixels — red channel controls X, green controls Y.

---

## Filter Region

By default, filters extend 10% beyond the element. For effects like blur or shadows that extend further, expand the region:

```svg
<filter id="big-shadow" x="-50%" y="-50%" width="200%" height="200%">
  <feDropShadow dx="20" dy="20" stdDeviation="10" />
</filter>
```

Without this, shadows might get clipped.

---

## Performance

Filters can be expensive. Tips:

1. **Keep filter regions small** — Don't use 500% width/height unless needed
2. **Limit blur radius** — Large `stdDeviation` values are slow
3. **Avoid on animated elements** — Recomputing filters every frame is costly
4. **Use CSS filters for simple effects** — `filter: blur(5px)` is often faster
5. **Test on mobile** — Filter performance varies significantly

---

## CSS Filters vs SVG Filters

CSS has shorthand filters:

```css
.element {
  filter: blur(5px);
  filter: brightness(1.2);
  filter: contrast(1.5);
  filter: drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.5));
  filter: grayscale(100%);
  filter: hue-rotate(90deg);
  filter: invert(100%);
  filter: saturate(200%);
  filter: sepia(100%);
}
```

Use CSS filters for simple effects. Use SVG filters for:

- Complex chains
- Custom effects not available in CSS
- Effects using lighting, displacement, turbulence

You can also reference SVG filters from CSS:

```css
.element {
  filter: url(#my-svg-filter);
}
```

---

## Practical Examples

### Frosted Glass

```svg
<filter id="frosted-glass">
  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
  <feColorMatrix in="blur" type="matrix"
    values="1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 0.8 0" />
</filter>
```

### Neon Glow

```svg
<filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
  <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur3" />
  <feMerge>
    <feMergeNode in="blur3" />
    <feMergeNode in="blur2" />
    <feMergeNode in="blur1" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

Apply to a bright-coloured stroke for that neon sign effect.

### Emboss

```svg
<filter id="emboss">
  <feConvolveMatrix order="3" kernelMatrix="
    -2 -1 0
    -1  1 1
     0  1 2
  " />
</filter>
```

### Inner Shadow

```svg
<filter id="inner-shadow">
  <!-- Create inverse alpha -->
  <feComponentTransfer in="SourceAlpha">
    <feFuncA type="table" tableValues="1 0" />
  </feComponentTransfer>
  <feGaussianBlur stdDeviation="3" result="blur" />
  <feOffset dx="3" dy="3" result="shadow" />
  <feComposite in="shadow" in2="SourceAlpha" operator="in" result="clipped" />
  <feMerge>
    <feMergeNode in="SourceGraphic" />
    <feMergeNode in="clipped" />
  </feMerge>
</filter>
```

---

## Animating Filters

Filter attributes can be animated:

```svg
<filter id="animated-blur">
  <feGaussianBlur stdDeviation="0">
    <animate attributeName="stdDeviation" values="0;10;0" dur="2s" repeatCount="indefinite" />
  </feGaussianBlur>
</filter>
```

Great for focus effects, pulsing glows, or transitions.

---

## Exercises

### Exercise 18.1: Drop Shadow

Create a custom drop shadow filter with a coloured shadow (not black).

### Exercise 18.2: Grayscale with Colour Pop

Create a filter that makes an image grayscale, then layer a coloured version on top through a mask — the "colour pop" effect.

### Exercise 18.3: Animated Glow

Create a pulsing glow effect using animated `stdDeviation`.

### Exercise 18.4: Noise Texture

Use `feTurbulence` to create a paper or film grain texture overlay.

### Exercise 18.5: Neon Text

Style text with a bright colour and apply a multi-layer glow filter for a neon sign effect.

---

## Key Takeaways

- Filters are defined in `<defs>`, applied with `filter="url(#id)"`
- Filter primitives chain together with `in` and `result`
- `feGaussianBlur` for blur, `feDropShadow` for shadows
- `feColorMatrix` for colour manipulation (grayscale, sepia, hue rotate)
- `feTurbulence` generates noise textures
- Expand filter region for effects that extend beyond the element
- Filter attributes can be animated
- Watch performance — filters can be expensive

---

## Summary So Far

You've covered everything from basic shapes to advanced filters. You now have the knowledge to:

- Create and style SVG graphics from scratch
- Draw complex shapes with path commands
- Animate with CSS, SMIL, and JavaScript
- Apply gradients, patterns, masks, and filters

### Where to go from here

- **Practice** — Build something! Icons, illustrations, animations
- **Explore libraries** — GSAP, anime.js, Framer Motion for complex animations
- **Study existing work** — Inspect SVGs on sites you admire
- **Optimise** — Learn about SVGO for production-ready files

Happy animating!

---

Next: [Lesson 19: Text Typography](/articles/19-text-typography)
