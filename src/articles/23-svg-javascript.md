---
title: "SVG + JavaScript"
description: "Bring SVGs to life with JavaScript. Learn to manipulate SVG elements, handle events, create dynamic graphics, and build interactive visualisations."
tags: ["svg"]
pubDate: "2025-12-02T08:00:00Z"
series: "svg-basics"
seriesOrder: 23
---

## Lesson 23: SVG + JavaScript

SVG elements are part of the DOM, just like HTML elements. That means you can select them, modify them, animate them, and respond to events — all with the JavaScript you already know.

---

## Selecting SVG Elements

Standard DOM methods work on SVG:

```javascript
// By ID
const circle = document.getElementById("my-circle");

// By class
const bars = document.querySelectorAll(".bar");

// By tag
const paths = document.getElementsByTagName("path");
```

```svg
<svg id="chart" width="400" height="200">
  <circle id="my-circle" cx="100" cy="100" r="50" fill="#3b82f6" />
  <rect class="bar" x="200" y="50" width="40" height="100" fill="#10b981" />
</svg>
```

---

## Modifying Attributes

Use `getAttribute()` and `setAttribute()`:

```javascript
const circle = document.getElementById("my-circle");

// Read
const radius = circle.getAttribute("r");
console.log(radius); // "50"

// Write
circle.setAttribute("r", "75");
circle.setAttribute("fill", "#ef4444");
```

### Common Attributes to Modify

- Position: `x`, `y`, `cx`, `cy`
- Size: `width`, `height`, `r`, `rx`, `ry`
- Appearance: `fill`, `stroke`, `stroke-width`, `opacity`
- Transform: `transform`
- Path: `d`

---

## Modifying Styles

SVG elements support inline styles and CSS classes:

```javascript
const rect = document.querySelector(".bar");

// Inline style
rect.style.fill = "#8b5cf6";
rect.style.opacity = "0.5";

// CSS classes
rect.classList.add("highlighted");
rect.classList.remove("dimmed");
rect.classList.toggle("active");
```

---

## Creating SVG Elements

SVG elements must be created with the SVG namespace:

```javascript
const svgNS = "http://www.w3.org/2000/svg";

// Create a circle
const circle = document.createElementNS(svgNS, "circle");
circle.setAttribute("cx", "100");
circle.setAttribute("cy", "100");
circle.setAttribute("r", "30");
circle.setAttribute("fill", "#3b82f6");

// Add to SVG
const svg = document.getElementById("my-svg");
svg.appendChild(circle);
```

### Helper Function

```javascript
function createSVGElement(tag, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

// Usage
const rect = createSVGElement("rect", {
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  fill: "#10b981",
});
svg.appendChild(rect);
```

---

## Event Handling

SVG elements support the same events as HTML:

```javascript
const circle = document.getElementById("my-circle");

circle.addEventListener("click", (e) => {
  console.log("Circle clicked!");
  e.target.setAttribute("fill", "#ef4444");
});

circle.addEventListener("mouseenter", () => {
  circle.setAttribute("r", "60");
});

circle.addEventListener("mouseleave", () => {
  circle.setAttribute("r", "50");
});
```

### Pointer Events

Control which parts of an SVG respond to events:

```css
/* Only the fill responds to clicks */
.shape {
  pointer-events: fill;
}

/* Only the stroke responds */
.shape {
  pointer-events: stroke;
}

/* Both fill and stroke */
.shape {
  pointer-events: all;
}

/* Ignore events entirely */
.shape {
  pointer-events: none;
}
```

---

## Animation with JavaScript

### Using requestAnimationFrame

```javascript
const circle = document.getElementById("my-circle");
let angle = 0;

function animate() {
  angle += 0.02;
  const x = 200 + Math.cos(angle) * 100;
  const y = 150 + Math.sin(angle) * 100;

  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);

  requestAnimationFrame(animate);
}

animate();
```

### Animating Path Data

```javascript
const path = document.getElementById("wave");
let offset = 0;

function animateWave() {
  offset += 0.1;

  const d = `M 0,50
             Q 25,${30 + Math.sin(offset) * 20} 50,50
             T 100,50 T 150,50 T 200,50`;

  path.setAttribute("d", d);
  requestAnimationFrame(animateWave);
}

animateWave();
```

### Using CSS Transitions

Let JavaScript trigger, let CSS animate:

```css
.circle {
  transition: r 0.3s ease, fill 0.3s ease;
}
```

```javascript
circle.setAttribute("r", "80"); // CSS handles the animation
```

---

## Practical Examples

### Interactive Bar Chart

```html
<svg id="chart" width="400" height="200">
  <!-- Bars will be added by JavaScript -->
</svg>
<div id="tooltip" class="tooltip"></div>
```

```javascript
const data = [
  { label: "Jan", value: 45 },
  { label: "Feb", value: 62 },
  { label: "Mar", value: 58 },
  { label: "Apr", value: 81 },
  { label: "May", value: 73 },
];

const svg = document.getElementById("chart");
const tooltip = document.getElementById("tooltip");
const barWidth = 50;
const gap = 20;
const maxValue = Math.max(...data.map((d) => d.value));

data.forEach((item, index) => {
  const barHeight = (item.value / maxValue) * 150;
  const x = index * (barWidth + gap) + 30;
  const y = 180 - barHeight;

  const bar = createSVGElement("rect", {
    x,
    y,
    width: barWidth,
    height: barHeight,
    fill: "#3b82f6",
    class: "bar",
  });

  bar.addEventListener("mouseenter", (e) => {
    bar.setAttribute("fill", "#1d4ed8");
    tooltip.textContent = `${item.label}: ${item.value}`;
    tooltip.style.display = "block";
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY - 20}px`;
  });

  bar.addEventListener("mouseleave", () => {
    bar.setAttribute("fill", "#3b82f6");
    tooltip.style.display = "none";
  });

  svg.appendChild(bar);
});
```

### Draggable Circle

```javascript
const circle = document.getElementById("draggable");
let isDragging = false;
let offset = { x: 0, y: 0 };

circle.addEventListener("mousedown", (e) => {
  isDragging = true;
  const cx = parseFloat(circle.getAttribute("cx"));
  const cy = parseFloat(circle.getAttribute("cy"));
  offset.x = e.clientX - cx;
  offset.y = e.clientY - cy;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  circle.setAttribute("cx", e.clientX - offset.x);
  circle.setAttribute("cy", e.clientY - offset.y);
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});
```

### Dynamic Pie Chart

```javascript
function createPieChart(data, cx, cy, radius) {
  let currentAngle = -Math.PI / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  data.forEach((item) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const endAngle = currentAngle + sliceAngle;

    const x1 = cx + radius * Math.cos(currentAngle);
    const y1 = cy + radius * Math.sin(currentAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const d = `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

    const slice = createSVGElement("path", {
      d,
      fill: item.color,
    });

    svg.appendChild(slice);
    currentAngle = endAngle;
  });
}

createPieChart(
  [
    { value: 30, color: "#3b82f6" },
    { value: 25, color: "#10b981" },
    { value: 20, color: "#f59e0b" },
    { value: 25, color: "#ef4444" },
  ],
  150,
  150,
  100
);
```

---

## Getting SVG Dimensions

```javascript
const svg = document.getElementById("my-svg");

// The actual rendered size
const bbox = svg.getBoundingClientRect();
console.log(bbox.width, bbox.height);

// The viewBox dimensions
const viewBox = svg.viewBox.baseVal;
console.log(viewBox.width, viewBox.height);

// For individual elements
const circle = document.getElementById("my-circle");
const circleBBox = circle.getBBox();
console.log(circleBBox.x, circleBBox.y, circleBBox.width, circleBBox.height);
```

---

## Coordinate Conversion

Converting between screen coordinates and SVG coordinates:

```javascript
function screenToSVG(svg, screenX, screenY) {
  const point = svg.createSVGPoint();
  point.x = screenX;
  point.y = screenY;

  const ctm = svg.getScreenCTM().inverse();
  return point.matrixTransform(ctm);
}

svg.addEventListener("click", (e) => {
  const svgPoint = screenToSVG(svg, e.clientX, e.clientY);
  console.log(`SVG coordinates: ${svgPoint.x}, ${svgPoint.y}`);
});
```

---

## Exercises

### Exercise 23.1: Click Counter

Create a circle that displays a number. Each click increments the number.

### Exercise 23.2: Random Dots

Create a button that adds a randomly positioned, randomly coloured circle to an SVG each time it's clicked.

### Exercise 23.3: Hover Highlight

Create multiple rectangles. When hovering over one, dim all the others.

### Exercise 23.4: Simple Drawing App

Create an SVG canvas where clicking creates circles at the click position.

### Exercise 23.5: Animated Progress Ring

Create a circular progress indicator that animates from 0% to 100% using `stroke-dasharray`.

---

## Key Takeaways

- SVG elements are DOM nodes — use standard methods to select and modify them
- Create SVG elements with `createElementNS()` using the SVG namespace
- Modify attributes with `getAttribute()` / `setAttribute()`
- SVG supports all standard events (click, hover, drag, etc.)
- Use `requestAnimationFrame` for smooth JavaScript animations
- Convert screen coordinates to SVG coordinates for accurate positioning
- Combine JavaScript control with CSS transitions for smooth effects

---

Next: [Lesson 24: Optimisation & Workflow](/articles/24-optimisation-workflow)
