---
title: "Transform Animations with SMIL"
description: "Learn how to animate SVG transforms using animateTransform. Master rotation, scaling, translation, and skewing animations with precise control points."
tags: ["svg"]
pubDate: "2025-12-01T08:00:00Z"
link: "13-transform-animations"
series: "svg-basics"
seriesOrder: 13
---

## Lesson 13: Transform Animations (SMIL)

The `<animateTransform>` element animates SVG transforms: rotation, scaling, translation, and skewing. It's particularly useful when you need to animate around specific points.

---

## Basic Syntax

```svg
<rect x="-25" y="-25" width="50" height="50" fill="coral">
  <animateTransform
    attributeName="transform"
    type="rotate"
    from="0"
    to="360"
    dur="2s"
    repeatCount="indefinite"
  />
</rect>
```

---

## Transform Types

### rotate

```svg
<svg width="200" height="200">
  <g transform="translate(100, 100)">
    <rect x="-25" y="-25" width="50" height="50" fill="steelblue">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0"
        to="360"
        dur="3s"
        repeatCount="indefinite"
      />
    </rect>
  </g>
</svg>
```

With rotation center:

```svg
<animateTransform
  attributeName="transform"
  type="rotate"
  from="0 100 100"
  to="360 100 100"
  dur="3s"
  repeatCount="indefinite"
/>
```

Format: `degrees centerX centerY`

### scale

```svg
<svg width="200" height="200">
  <g transform="translate(100, 100)">
    <circle cx="0" cy="0" r="30" fill="coral">
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1; 1.3; 1"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  </g>
</svg>
```

Two values for non-uniform scaling: `scaleX scaleY`

### translate

```svg
<circle cx="30" cy="100" r="20" fill="mediumseagreen">
  <animateTransform
    attributeName="transform"
    type="translate"
    values="0 0; 140 0; 0 0"
    dur="2s"
    repeatCount="indefinite"
  />
</circle>
```

Format: `x y` (y defaults to 0)

### skewX and skewY

```svg
<rect x="75" y="75" width="50" height="50" fill="orchid">
  <animateTransform
    attributeName="transform"
    type="skewX"
    values="0; 20; 0; -20; 0"
    dur="2s"
    repeatCount="indefinite"
  />
</rect>
```

---

## The additive Attribute

By default, each animateTransform **replaces** any existing transform. Use `additive="sum"` to combine them:

```svg
<g transform="translate(100, 100)">
  <rect x="-25" y="-25" width="50" height="50" fill="coral">
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0"
      to="360"
      dur="3s"
      repeatCount="indefinite"
      additive="sum"
    />
  </rect>
</g>
```

Now the rotation adds to the parent's translate.

---

## Combining Multiple Transforms

Chain multiple `<animateTransform>` elements:

```svg
<svg width="200" height="200">
  <rect x="75" y="75" width="50" height="50" fill="steelblue">
    <!-- Rotate -->
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 100 100"
      to="360 100 100"
      dur="4s"
      repeatCount="indefinite"
    />
    <!-- Scale (additive) -->
    <animateTransform
      attributeName="transform"
      type="scale"
      values="1; 1.2; 1"
      dur="1s"
      repeatCount="indefinite"
      additive="sum"
    />
  </rect>
</svg>
```

The square rotates continuously while pulsing in size.

---

## accumulate Attribute

For repeated animations, `accumulate="sum"` builds on each iteration:

```svg
<rect x="10" y="90" width="20" height="20" fill="coral">
  <animateTransform
    attributeName="transform"
    type="translate"
    by="30 0"
    dur="0.5s"
    repeatCount="5"
    accumulate="sum"
  />
</rect>
```

Each repeat moves an additional 30 units right, so after 5 iterations, it's moved 150 units total.

---

## Practical Example: Loading Spinner

```svg
<svg width="50" height="50" viewBox="0 0 50 50">
  <circle
    cx="25" cy="25" r="20"
    fill="none"
    stroke="#e5e7eb"
    stroke-width="4"
  />
  <path
    d="M 25 5 A 20 20 0 0 1 45 25"
    fill="none"
    stroke="#3b82f6"
    stroke-width="4"
    stroke-linecap="round"
  >
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 25 25"
      to="360 25 25"
      dur="1s"
      repeatCount="indefinite"
    />
  </path>
</svg>
```

---

## Practical Example: Bouncing Ball

```svg
<svg width="200" height="200">
  <circle cx="100" cy="40" r="20" fill="coral">
    <!-- Vertical bounce -->
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0 0; 0 120; 0 0"
      keyTimes="0; 0.5; 1"
      keySplines="0.5 0 1 0.5; 0 0.5 0.5 1"
      calcMode="spline"
      dur="1s"
      repeatCount="indefinite"
    />
    <!-- Squash on impact -->
    <animateTransform
      attributeName="transform"
      type="scale"
      values="1 1; 1.2 0.8; 1 1"
      keyTimes="0; 0.5; 1"
      dur="1s"
      repeatCount="indefinite"
      additive="sum"
    />
  </circle>
</svg>
```

---

## Practical Example: Orbiting Planets

```svg
<svg width="200" height="200">
  <!-- Sun -->
  <circle cx="100" cy="100" r="20" fill="gold" />

  <!-- Earth orbit -->
  <g>
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 100 100"
      to="360 100 100"
      dur="4s"
      repeatCount="indefinite"
    />
    <circle cx="160" cy="100" r="8" fill="dodgerblue" />

    <!-- Moon orbits Earth -->
    <g transform="translate(160, 100)">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0"
        to="360"
        dur="1s"
        repeatCount="indefinite"
        additive="sum"
      />
      <circle cx="15" cy="0" r="3" fill="gray" />
    </g>
  </g>
</svg>
```

The moon orbits the earth while the earth orbits the sun!

---

## Exercise 13.1: Rotating Fan

Create 3 or 4 rectangles arranged like fan blades, rotating around a center point.

## Exercise 13.2: Heartbeat

Create a heart shape (or circle) that scales like a heartbeat:

- Quick expand
- Quick contract
- Pause
- Repeat

## Exercise 13.3: Pendulum

Create a pendulum that swings back and forth. Use rotation with values like `"-30; 30; -30"`.

## Exercise 13.4: Complex Motion

Create a shape that simultaneously:

- Rotates continuously
- Pulses in size
- Moves side to side

Use multiple `<animateTransform>` with `additive="sum"`.

---

## Key Takeaways

- `<animateTransform>` animates transform attribute
- Types: rotate, scale, translate, skewX, skewY
- Rotation format: `"degrees"` or `"degrees centerX centerY"`
- Use `additive="sum"` to combine multiple transforms
- Nest elements for complex hierarchical animations
- Chain `<animateTransform>` elements for combined effects

---

Next: [Lesson 14: Motion Paths](/articles/14-motion-paths)
