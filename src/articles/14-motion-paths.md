---
title: "Motion Paths with SMIL"
description: "Learn how to move SVG elements along custom paths using animateMotion. Create orbital animations, path-following effects, and complex motion sequences."
tags: ["svg"]
pubDate: "2025-12-01T08:15:00Z"
link: "14-motion-paths"
series: "svg-basics"
seriesOrder: 14
---

## Lesson 14: Motion Paths

The `<animateMotion>` element moves objects along a path. It's perfect for animations where something needs to follow a specific route — like a car on a road, a planet in orbit, or a particle effect.

---

## Basic Syntax

```svg
<svg width="300" height="200">
  <!-- The path to follow (visible) -->
  <path
    id="track"
    d="M 50 100 Q 150 20, 250 100"
    fill="none"
    stroke="#e5e7eb"
    stroke-width="2"
  />

  <!-- The moving object -->
  <circle r="10" fill="coral">
    <animateMotion
      dur="3s"
      repeatCount="indefinite"
    >
      <mpath href="#track" />
    </animateMotion>
  </circle>
</svg>
```

The circle follows the curve.

---

## Defining the Path

### Using mpath (Reference)

Reference an existing path element:

```svg
<path id="route" d="M 0 0 L 100 100" />

<circle r="5" fill="blue">
  <animateMotion dur="2s">
    <mpath href="#route" />
  </animateMotion>
</circle>
```

### Using path Attribute (Inline)

Define the path directly:

```svg
<circle r="5" fill="blue">
  <animateMotion
    path="M 0 0 L 100 100"
    dur="2s"
  />
</circle>
```

### Using values (Points)

Simple linear movement through points:

```svg
<circle r="5" fill="blue">
  <animateMotion
    values="0,0; 100,0; 100,100; 0,100; 0,0"
    dur="4s"
    repeatCount="indefinite"
  />
</circle>
```

---

## Auto-Rotation: rotate

By default, the object doesn't rotate as it follows the path. Add `rotate` to change this:

| Value          | Effect                                 |
| -------------- | -------------------------------------- |
| `auto`         | Rotate to face the direction of motion |
| `auto-reverse` | Face backward (180° from auto)         |
| `number`       | Fixed rotation angle                   |

```svg
<!-- Arrow that points in direction of travel -->
<polygon points="-5,-5 10,0 -5,5" fill="coral">
  <animateMotion
    path="M 50 100 Q 150 20, 250 100"
    dur="3s"
    rotate="auto"
    repeatCount="indefinite"
  />
</polygon>
```

Without `rotate="auto"`, the arrow would always point right. With it, the arrow turns to follow the curve.

---

## Timing Control

### keyPoints

Specify where on the path (0-1) to be at each keyTime:

```svg
<animateMotion
  dur="4s"
  keyPoints="0; 0.3; 0.7; 1"
  keyTimes="0; 0.25; 0.75; 1"
>
  <mpath href="#track" />
</animateMotion>
```

This creates variable speed — fast in the middle, slow at ends.

### calcMode

Control interpolation:

```svg
<animateMotion
  dur="3s"
  calcMode="spline"
  keySplines="0.4 0 0.2 1"
  keyTimes="0; 1"
  keyPoints="0; 1"
>
  <mpath href="#track" />
</animateMotion>
```

---

## Practical Example: Flying Plane

```svg
<svg width="400" height="200">
  <!-- Cloud path (hidden) -->
  <path
    id="flightPath"
    d="M -50 100 Q 100 30, 200 100 T 450 100"
    fill="none"
    stroke="none"
  />

  <!-- Airplane (simple triangle) -->
  <polygon points="0,-8 20,0 0,8 5,0" fill="#3b82f6">
    <animateMotion
      dur="4s"
      rotate="auto"
      repeatCount="indefinite"
    >
      <mpath href="#flightPath" />
    </animateMotion>
  </polygon>
</svg>
```

---

## Practical Example: Circular Orbit

```svg
<svg width="200" height="200">
  <!-- Center point -->
  <circle cx="100" cy="100" r="10" fill="gold" />

  <!-- Orbit path (visible) -->
  <circle
    cx="100" cy="100" r="50"
    fill="none"
    stroke="#e5e7eb"
    stroke-width="1"
    stroke-dasharray="4 4"
  />

  <!-- Orbiting object -->
  <circle r="8" fill="dodgerblue">
    <animateMotion
      path="M 150 100 A 50 50 0 1 1 149.99 100"
      dur="3s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
```

The path is a full circle arc (A command that returns to start).

---

## Practical Example: Dotted Line Loader

```svg
<svg width="200" height="50">
  <path
    id="loaderPath"
    d="M 20 25 L 180 25"
    fill="none"
    stroke="#e5e7eb"
    stroke-width="4"
    stroke-linecap="round"
  />

  <!-- Moving dot -->
  <circle r="6" fill="#3b82f6">
    <animateMotion
      dur="1.5s"
      repeatCount="indefinite"
    >
      <mpath href="#loaderPath" />
    </animateMotion>
  </circle>
</svg>
```

---

## Practical Example: Train on Tracks

```svg
<svg width="400" height="200">
  <!-- Track -->
  <path
    id="tracks"
    d="M 20 150 Q 100 50, 200 100 T 380 80"
    fill="none"
    stroke="#666"
    stroke-width="4"
  />

  <!-- Train cars -->
  <g>
    <!-- Engine -->
    <rect x="-15" y="-10" width="30" height="20" fill="red" rx="3">
      <animateMotion dur="6s" rotate="auto" repeatCount="indefinite">
        <mpath href="#tracks" />
      </animateMotion>
    </rect>
  </g>

  <g>
    <!-- Car 1 (delayed) -->
    <rect x="-12" y="-8" width="24" height="16" fill="blue" rx="2">
      <animateMotion dur="6s" rotate="auto" repeatCount="indefinite" begin="0.3s">
        <mpath href="#tracks" />
      </animateMotion>
    </rect>
  </g>

  <g>
    <!-- Car 2 (more delayed) -->
    <rect x="-12" y="-8" width="24" height="16" fill="green" rx="2">
      <animateMotion dur="6s" rotate="auto" repeatCount="indefinite" begin="0.6s">
        <mpath href="#tracks" />
      </animateMotion>
    </rect>
  </g>
</svg>
```

The train cars follow each other along the track!

---

## Combining with Other Animations

Animate other properties while moving:

```svg
<svg width="300" height="200">
  <path id="path" d="M 30 100 Q 150 30, 270 100" fill="none" stroke="#ddd" />

  <circle r="15" fill="coral">
    <!-- Movement -->
    <animateMotion dur="2s" repeatCount="indefinite">
      <mpath href="#path" />
    </animateMotion>

    <!-- Pulsing size -->
    <animate
      attributeName="r"
      values="15;20;15"
      dur="0.5s"
      repeatCount="indefinite"
    />

    <!-- Color change -->
    <animate
      attributeName="fill"
      values="coral;gold;coral"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
```

---

## CSS Alternative: offset-path

Modern CSS can also do motion paths:

```css
.mover {
  offset-path: path("M 50 100 Q 150 20, 250 100");
  offset-rotate: auto;
  animation: move 3s linear infinite;
}

@keyframes move {
  100% {
    offset-distance: 100%;
  }
}
```

Browser support is good in modern browsers.

---

## Exercise 14.1: Figure Eight

Create an object that moves in a figure-8 pattern.

Hint: The path `M 100 100 C 150 50, 200 150, 150 100 C 100 50, 50 150, 100 100` approximates a figure-8.

## Exercise 14.2: Car on a Road

Draw a simple winding road path, and animate a rectangle (car) along it with `rotate="auto"`.

## Exercise 14.3: Particles

Create multiple small circles that follow the same path but with different delays, creating a particle stream effect.

## Exercise 14.4: Roller Coaster

Draw a roller coaster track with hills and loops. Animate a "cart" along it that rotates to follow the track.

---

## Key Takeaways

- `<animateMotion>` moves elements along paths
- Use `<mpath href="#id">` to reference a path element
- Or use the `path` attribute for inline path data
- `rotate="auto"` makes objects face the direction of travel
- Use `keyPoints` and `keyTimes` for variable speed
- Combine with other `<animate>` elements for rich effects
- CSS `offset-path` is a modern alternative

---

Next: [Lesson 15: Stroke Animations](/articles/15-stroke-animations)
