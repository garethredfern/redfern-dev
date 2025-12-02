---
title: "Accessibility"
description: "Make your SVGs usable by everyone. Learn to add meaningful titles, descriptions, and ARIA attributes so screen readers can interpret your graphics."
tags: ["svg"]
pubDate: "2025-12-02T07:00:00Z"
link: "21-accessibility"
---

## Lesson 21: Accessibility

A beautiful SVG is worthless if some users can't understand it. Screen readers, keyboard navigation, and assistive technologies need proper markup to convey meaning. Good accessibility isn't hard — it just requires intention.

---

## The Problem

By default, screen readers treat SVGs as... nothing useful. They might announce "graphic" or skip it entirely. Users who can't see the image miss the information it conveys.

```svg
<!-- Inaccessible -->
<svg width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>
```

A screen reader has no idea this is supposed to be an envelope icon.

---

## The `<title>` Element

The `<title>` element provides a human-readable name for the SVG:

```svg
<svg width="24" height="24">
  <title>Email</title>
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>
```

This is the SVG equivalent of an `alt` attribute on `<img>`. Screen readers will announce "Email, graphic."

### Placement Matters

`<title>` should be the **first child** of the element it describes:

```svg
<svg>
  <title>Chart showing sales growth</title>
  <!-- rest of SVG -->
</svg>
```

You can also add titles to specific elements within an SVG:

```svg
<svg>
  <title>Company Overview</title>
  <g>
    <title>Sales Department</title>
    <rect ... />
  </g>
  <g>
    <title>Marketing Department</title>
    <rect ... />
  </g>
</svg>
```

---

## The `<desc>` Element

For complex graphics, add a longer description:

```svg
<svg width="400" height="300">
  <title>Q3 Sales Chart</title>
  <desc>
    Bar chart showing monthly sales for Q3 2025.
    July: £45,000. August: £52,000. September: £61,000.
    Sales increased 35% over the quarter.
  </desc>
  <!-- chart elements -->
</svg>
```

The `<desc>` element provides context that a title alone can't convey — trends, data points, relationships.

---

## ARIA Attributes

ARIA (Accessible Rich Internet Applications) attributes give you fine-grained control:

### role="img"

Tells assistive tech to treat the SVG as a single image:

```svg
<svg role="img" aria-labelledby="title">
  <title id="title">Warning: Low battery</title>
  <path d="..." />
</svg>
```

### aria-labelledby

References the `id` of the title (and optionally description):

```svg
<svg role="img" aria-labelledby="chart-title chart-desc">
  <title id="chart-title">Quarterly Revenue</title>
  <desc id="chart-desc">Revenue grew from £1.2M to £1.8M</desc>
  <!-- chart -->
</svg>
```

### aria-label

For simple cases, you can skip `<title>` and use `aria-label` directly:

```svg
<svg aria-label="Close" role="img">
  <path d="M6 18L18 6M6 6l12 12" />
</svg>
```

### aria-hidden="true"

For **decorative** SVGs that add no information:

```svg
<svg aria-hidden="true">
  <!-- purely decorative swirl -->
</svg>
```

Screen readers will skip this entirely. Use this for backgrounds, separators, and visual flourishes.

---

## The Complete Pattern

Here's the recommended pattern for meaningful SVGs:

```svg
<svg
  role="img"
  aria-labelledby="svg-title svg-desc"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24"
  height="24"
>
  <title id="svg-title">Notification bell</title>
  <desc id="svg-desc">You have 3 unread notifications</desc>
  <path d="..." fill="currentColor" />
</svg>
```

### Breakdown:

1. `role="img"` — Treats SVG as a single image
2. `aria-labelledby` — Points to title and description
3. `<title>` with `id` — Short label
4. `<desc>` with `id` — Longer explanation (optional)

---

## Icon Buttons

Icons inside buttons need special handling:

### Option 1: Button has visible text

```html
<button>
  <svg aria-hidden="true" width="20" height="20">
    <use href="#icon-save" />
  </svg>
  Save
</button>
```

The button's text provides meaning, so hide the icon from screen readers.

### Option 2: Icon-only button

```html
<button aria-label="Save document">
  <svg aria-hidden="true" width="20" height="20">
    <use href="#icon-save" />
  </svg>
</button>
```

Put the label on the button, hide the SVG.

### Option 3: SVG provides the label

```html
<button>
  <svg role="img" aria-label="Save document" width="20" height="20">
    <use href="#icon-save" />
  </svg>
</button>
```

This works but Option 2 is generally preferred.

---

## Focusable SVGs

If an SVG is interactive, it needs to be focusable:

```svg
<svg
  tabindex="0"
  role="button"
  aria-label="Play video"
  onclick="playVideo()"
  onkeydown="handleKey(event)"
>
  <polygon points="5,3 19,12 5,21" fill="currentColor" />
</svg>
```

### Requirements for interactive SVGs:

1. `tabindex="0"` — Makes it keyboard focusable
2. `role` — Describes what it does (button, link, etc.)
3. `aria-label` — What it's called
4. Keyboard handler — Respond to Enter/Space

Better yet, wrap in a real `<button>`:

```html
<button onclick="playVideo()" class="play-btn">
  <svg aria-hidden="true">
    <polygon points="5,3 19,12 5,21" />
  </svg>
  <span class="sr-only">Play video</span>
</button>
```

---

## Data Visualisations

Charts and graphs need extra care:

```svg
<svg role="img" aria-labelledby="chart-title chart-desc">
  <title id="chart-title">Monthly website visitors</title>
  <desc id="chart-desc">
    Bar chart showing visitors per month.
    January: 12,400. February: 14,200. March: 18,900.
    Traffic increased 52% over the quarter.
  </desc>

  <!-- Visual chart elements -->
  <g aria-hidden="true">
    <rect x="10" y="50" width="30" height="100" fill="#3b82f6" />
    <rect x="50" y="30" width="30" height="120" fill="#3b82f6" />
    <rect x="90" y="10" width="30" height="140" fill="#3b82f6" />
  </g>
</svg>
```

The description conveys the data; the visual elements are marked decorative.

For complex interactive charts, consider providing a data table alternative.

---

## Testing Accessibility

### Screen Reader Testing

- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free) or JAWS
- **Browser extensions**: axe DevTools, WAVE

### Quick Checks

1. Does the SVG have a `<title>` or `aria-label`?
2. Is `role="img"` set for standalone graphics?
3. Are decorative SVGs marked `aria-hidden="true"`?
4. Can you tab to interactive SVGs?
5. Do icon buttons have accessible names?

---

## Common Patterns

### Decorative Icon

```svg
<svg aria-hidden="true" width="24" height="24">
  <use href="#icon-decorative" />
</svg>
```

### Meaningful Standalone Icon

```svg
<svg role="img" aria-label="Warning" width="24" height="24">
  <use href="#icon-warning" />
</svg>
```

### Complex Infographic

```svg
<svg role="img" aria-labelledby="info-title info-desc">
  <title id="info-title">How our process works</title>
  <desc id="info-desc">
    Three-step process: 1. Submit your application.
    2. We review within 48 hours. 3. Receive your approval.
  </desc>
  <!-- visual content -->
</svg>
```

### Logo

```svg
<svg role="img" aria-label="Acme Corporation logo">
  <!-- logo paths -->
</svg>
```

---

## Exercises

### Exercise 21.1: Accessible Icon

Take any icon and add proper `<title>` and ARIA attributes.

### Exercise 21.2: Icon Button

Create a "delete" icon button that's properly accessible with keyboard support.

### Exercise 21.3: Chart Description

Create a simple bar chart with a `<desc>` that conveys the data to screen reader users.

### Exercise 21.4: Test with a Screen Reader

Turn on VoiceOver (Mac) or NVDA (Windows) and navigate through an SVG you've created.

---

## Key Takeaways

- Use `<title>` for a short label (like `alt` text)
- Use `<desc>` for longer explanations
- Add `role="img"` to standalone SVGs
- Use `aria-hidden="true"` for decorative graphics
- Icon-only buttons need `aria-label` on the button
- Interactive SVGs need `tabindex` and keyboard handlers
- Test with actual screen readers, not just automated tools

---

Next: [Lesson 22: Responsive SVG](/articles/22-responsive-svg)
