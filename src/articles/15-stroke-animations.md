---
title: "Stroke Animations: The Line Drawing Effect"
description: "Master the popular line drawing effect using stroke-dasharray and stroke-dashoffset. Create smooth animations that make paths appear to draw themselves."
tags: ["svg"]
pubDate: "2025-12-01T08:30:00Z"
series: "svg-basics"
seriesOrder: 15
---

## Lesson 15: Stroke Animations

The "line drawing" effect — where a path appears to draw itself — is one of the most popular SVG animations. It's simpler than you might think.

---

## How It Works

The trick uses two properties:

- `stroke-dasharray` — Creates dashed lines
- `stroke-dashoffset` — Shifts the dash pattern

If your dash is as long as the entire path, and you offset it by that same length, the path is invisible. Animate the offset to zero, and the path "draws" itself.

---

## Step by Step

### 1. Create a Path

```svg
<svg width="200" height="200">
  <path
    d="M 20 100 Q 100 20, 180 100"
    fill="none"
    stroke="black"
    stroke-width="3"
    class="draw"
  />
</svg>
```

### 2. Find the Path Length

You need to know how long the path is. In JavaScript:

```javascript
const path = document.querySelector(".draw");
console.log(path.getTotalLength()); // e.g., 186.5
```

Or estimate generously (too long is fine, too short won't work).

### 3. Set Up the Dash

```css
.draw {
  stroke-dasharray: 200; /* Dash length = path length (or longer) */
  stroke-dashoffset: 200; /* Offset by the same amount = hidden */
}
```

At this point, the path is invisible.

### 4. Animate the Offset

```css
.draw {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

The path draws itself over 2 seconds!

---

## Complete Example

```svg
<svg width="300" height="200" viewBox="0 0 300 200">
  <path
    d="M 20 180 L 80 50 L 140 120 L 200 30 L 260 100"
    fill="none"
    stroke="#3b82f6"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="line-chart"
  />
</svg>
```

```css
.line-chart {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: drawLine 1.5s ease-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Reverse Drawing (Erasing)

Animate in the opposite direction:

```css
.erase {
  stroke-dasharray: 200;
  stroke-dashoffset: 0;
  animation: eraseLine 1s ease-in forwards;
}

@keyframes eraseLine {
  to {
    stroke-dashoffset: 200;
  }
}
```

Or use negative values to draw from the other end:

```css
@keyframes drawReverse {
  from {
    stroke-dashoffset: -200;
  }
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Drawing Multiple Paths

Stagger the animations with delays:

```svg
<svg width="300" height="200">
  <path d="M 50 100 L 150 100" class="line line-1" />
  <path d="M 150 100 L 150 50" class="line line-2" />
  <path d="M 150 50 L 250 50" class="line line-3" />
</svg>
```

```css
.line {
  fill: none;
  stroke: black;
  stroke-width: 2;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw 0.5s ease forwards;
}

.line-1 {
  animation-delay: 0s;
}
.line-2 {
  animation-delay: 0.5s;
}
.line-3 {
  animation-delay: 1s;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

Each line segment draws in sequence.

---

## Using SMIL

The same effect without CSS:

```svg
<svg width="200" height="200">
  <path
    d="M 20 100 Q 100 20, 180 100"
    fill="none"
    stroke="black"
    stroke-width="3"
    stroke-dasharray="200"
    stroke-dashoffset="200"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="200"
      to="0"
      dur="2s"
      fill="freeze"
    />
  </path>
</svg>
```

---

## Drawing on Scroll (with JavaScript)

A common effect: paths draw as you scroll down the page.

```javascript
const path = document.querySelector(".draw");
const pathLength = path.getTotalLength();

// Set up initial state
path.style.strokeDasharray = pathLength;
path.style.strokeDashoffset = pathLength;

window.addEventListener("scroll", () => {
  // Calculate scroll percentage
  const scrollPercent =
    window.scrollY / (document.body.scrollHeight - window.innerHeight);

  // Draw based on scroll
  const drawLength = pathLength * scrollPercent;
  path.style.strokeDashoffset = pathLength - drawLength;
});
```

---

## Handwriting Effect

For text or signatures, combine with a handwriting-style path:

```svg
<svg viewBox="0 0 400 100">
  <path
    d="M 20 50 C 40 20, 60 80, 80 50 C 100 20, 120 80, 140 50..."
    fill="none"
    stroke="black"
    stroke-width="2"
    stroke-linecap="round"
    class="signature"
  />
</svg>
```

```css
.signature {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: write 3s ease forwards;
}

@keyframes write {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Animated Checkmark

A satisfying "task complete" animation:

```svg
<svg width="100" height="100" viewBox="0 0 100 100">
  <!-- Background circle -->
  <circle cx="50" cy="50" r="45" fill="#22c55e" />

  <!-- Checkmark -->
  <path
    d="M 25 50 L 45 70 L 75 35"
    fill="none"
    stroke="white"
    stroke-width="6"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="check"
  />
</svg>
```

```css
.check {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: drawCheck 0.4s ease-out 0.2s forwards;
}

@keyframes drawCheck {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Infinite Drawing Loop

Draw, then erase, repeat:

```css
.loop {
  stroke-dasharray: 200;
  animation: drawLoop 4s linear infinite;
}

@keyframes drawLoop {
  0% {
    stroke-dashoffset: 200;
  }
  45% {
    stroke-dashoffset: 0;
  }
  55% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -200;
  }
}
```

---

## Complex Example: Icon Drawing

```svg
<svg width="100" height="100" viewBox="0 0 24 24">
  <!-- House icon -->
  <path
    d="M 3 12 L 12 3 L 21 12 M 5 10 V 20 H 19 V 10"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="house"
  />
</svg>
```

```css
.house {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawHouse 1.5s ease-out forwards;
}

@keyframes drawHouse {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Tips and Tricks

### Getting Exact Path Length

```javascript
document.querySelectorAll("path").forEach((path) => {
  console.log(path.getTotalLength());
});
```

### Handling Multiple Segments

If a path has multiple subpaths (multiple M commands), each draws independently. You might need to split them into separate `<path>` elements for precise control.

### Performance

- Stroke animations are GPU-accelerated and performant
- Avoid animating many paths simultaneously
- Consider using `will-change: stroke-dashoffset` for complex animations

### Browser Support

Excellent across all modern browsers. Works on:

- Chrome, Firefox, Safari, Edge
- Mobile browsers
- Even IE11 (for CSS animations; SMIL has issues)

---

## Exercise 15.1: Self-Drawing Logo

Create a simple logo (your initials, a symbol, etc.) using paths, and animate it to draw itself.

## Exercise 15.2: Drawing Then Filling

1. Draw a shape's outline first
2. Once complete, fade in the fill

Hint: Use `animation-delay` on a separate fill animation.

## Exercise 15.3: Interactive Draw

Create a path that draws when you hover over the SVG, and erases when you hover out.

## Exercise 15.4: Scroll-Triggered

Create a line chart that draws as the user scrolls. At 0% scroll, nothing is drawn. At 100% scroll, the full chart is visible.

---

## Key Takeaways

- Line drawing uses `stroke-dasharray` and `stroke-dashoffset`
- Set both to the path length to hide it
- Animate `stroke-dashoffset` to 0 to draw
- Use `getTotalLength()` to find the exact path length
- Stagger delays for multi-path sequences
- Works with CSS animations, transitions, and SMIL

---

Next: [Lesson 16: Gradients & Patterns](/articles/16-gradients-patterns)
