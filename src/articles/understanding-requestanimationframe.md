---
title: "Understanding requestAnimationFrame"
description: "A practical guide to browser animation timing. Learn what requestAnimationFrame actually does, why it beats setInterval, and how to use it properly."
tags: ["javascript", "animation", "performance"]
pubDate: "2025-12-02T11:30:00Z"
---

## Understanding requestAnimationFrame

If you've ever built animations in JavaScript, you've probably reached for `setInterval` or `setTimeout`. They work, but there's a better way: `requestAnimationFrame`.

Let's break down what it actually does and why it matters.

## The Problem with setInterval

Here's how most developers start animating:

```javascript
let position = 0;

setInterval(() => {
  position += 1;
  element.style.transform = `translateX(${position}px)`;
}, 16); // roughly 60fps
```

This has real problems:

- It keeps running even when the tab is hidden (wasting battery)
- It doesn't sync with the browser's actual repaint cycle
- You're guessing at the timing (16ms ≈ 60fps, but that's not guaranteed)
- It can cause janky animations when the browser is busy

## What requestAnimationFrame Actually Does

`requestAnimationFrame` tells the browser: "Before you paint the next frame, run this function."

The browser handles the timing. It knows when the screen will refresh (usually 60Hz, but could be 120Hz or 144Hz on newer displays) and schedules your code to run right before each paint.

```javascript
let position = 0;

function animate() {
  position += 1;
  element.style.transform = `translateX(${position}px)`;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

## The Key Differences

**Timing is handled by the browser.** You don't guess at frame rates. On a 60Hz display, it runs ~60 times per second. On a 144Hz display, it runs ~144 times per second.

**It pauses when the tab is hidden.** Switch to another tab? The animation stops. No wasted CPU cycles, no battery drain.

**It syncs with the paint cycle.** Your changes happen right before the browser repaints, which means smoother animations with no tearing.

## Using the Timestamp Parameter

`requestAnimationFrame` passes a timestamp to your callback. This is crucial for frame-rate independent animation:

```javascript
let startTime = null;
const duration = 2000; // 2 seconds
const distance = 300; // pixels

function animate(timestamp) {
  if (!startTime) startTime = timestamp;

  const elapsed = timestamp - startTime;
  const progress = Math.min(elapsed / duration, 1);

  element.style.transform = `translateX(${progress * distance}px)`;

  if (progress < 1) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);
```

This moves the element 300px over exactly 2 seconds, regardless of frame rate. On a 60Hz monitor or a 144Hz monitor, the animation takes the same amount of time.

## Stopping an Animation

`requestAnimationFrame` returns an ID you can use to cancel:

```javascript
let animationId = null;

function start() {
  function animate() {
    // do animation work
    animationId = requestAnimationFrame(animate);
  }
  animationId = requestAnimationFrame(animate);
}

function stop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
```

## A Practical Pattern

Here's a reusable animation function you can use:

```javascript
function animateValue({ from, to, duration, onUpdate, onComplete }) {
  const startTime = performance.now();

  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Linear interpolation
    const value = from + (to - from) * progress;
    onUpdate(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(tick);
}

// Usage
animateValue({
  from: 0,
  to: 100,
  duration: 1000,
  onUpdate: (val) => {
    counter.textContent = Math.round(val);
  },
  onComplete: () => {
    console.log("Done!");
  },
});
```

## When to Use It

Use `requestAnimationFrame` for:

- DOM animations (position, opacity, transforms)
- Canvas drawing
- WebGL rendering
- Scroll-linked effects
- Any visual update that needs to sync with the display

Don't use it for:

- Non-visual timers (use `setTimeout`)
- Precise timing that must continue in background tabs

## Browser Support

It's supported everywhere that matters. IE10+ and all modern browsers. No polyfill needed in 2025.

## The Takeaway

`requestAnimationFrame` isn't just a better `setInterval`. It's the correct way to animate in the browser. The browser knows when it's going to paint — let it tell you when to update.

Your animations will be smoother, your battery usage lower, and your code cleaner.
