---
title: "Optimisation & Workflow"
description: "Ship production-ready SVGs. Learn to optimise file size with SVGO, export cleanly from design tools, and establish an efficient SVG workflow."
tags: ["svg"]
pubDate: "2025-12-02T08:30:00Z"
link: "24-optimisation-workflow"
---

## Lesson 24: Optimisation & Workflow

You've learned to create, style, and animate SVGs. Now let's make sure they're production-ready — small, clean, and efficient. This lesson covers the tools and techniques professionals use to ship optimised SVGs.

---

## Why Optimise?

SVGs exported from design tools often contain:

- Unnecessary metadata (editor info, layer names)
- Redundant attributes
- Excessive decimal precision
- Empty groups and hidden elements
- Inline styles that could be attributes

A 50KB SVG might optimise down to 5KB. That matters for performance.

---

## SVGO: The Essential Tool

**SVGO** (SVG Optimizer) is the industry-standard tool for optimising SVGs.

### Installation

```bash
npm install -g svgo
```

### Basic Usage

```bash
# Optimise a single file
svgo input.svg -o output.svg

# Optimise in place
svgo input.svg

# Optimise a directory
svgo -f ./icons -o ./icons-optimised
```

### What SVGO Does

- Removes metadata and comments
- Removes empty containers
- Removes unused definitions
- Collapses useless groups
- Converts shapes to shorter paths
- Rounds numbers to fewer decimals
- Merges multiple paths
- Removes default attribute values

### Example: Before and After

**Before (from Illustrator):**

```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 24 24"
     style="enable-background:new 0 0 24 24;" xml:space="preserve">
  <style type="text/css">
    .st0{fill:#3B82F6;}
  </style>
  <g id="icon">
    <circle class="st0" cx="12.0000000" cy="12.0000000" r="10.0000000"/>
  </g>
</svg>
```

**After SVGO:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#3B82F6"/>
</svg>
```

---

## SVGO Configuration

Create `svgo.config.js` for custom settings:

```javascript
module.exports = {
  plugins: [
    "preset-default",
    "removeDimensions",
    {
      name: "removeAttrs",
      params: {
        attrs: ["data-name", "class"],
      },
    },
    {
      name: "addAttributesToSVGElement",
      params: {
        attributes: [{ "aria-hidden": "true" }],
      },
    },
  ],
};
```

### Useful Plugin Options

```javascript
// Keep viewBox, remove width/height
'removeDimensions'

// Keep specific IDs (for CSS/JS targeting)
{
  name: 'cleanupIds',
  params: {
    preserve: ['icon-home', 'icon-search']
  }
}

// Round to fewer decimal places
{
  name: 'cleanupNumericValues',
  params: {
    floatPrecision: 2
  }
}

// Don't merge paths (keeps them editable)
{
  name: 'mergePaths',
  active: false
}
```

---

## Online Tools

If you can't install SVGO:

- **[SVGOMG](https://jakearchibald.github.io/svgomg/)** — SVGO with a visual interface
- **[SVG Minifier](https://www.svgminify.com/)** — Simple drag-and-drop
- **[Nano](https://vecta.io/nano)** — Advanced compression

SVGOMG is particularly good — you can toggle options and see the result live.

---

## Exporting from Design Tools

### Figma

1. Select the frame/component
2. Right-click → Copy as SVG, or
3. Export → SVG → check "Include 'id' attribute" if needed

**Tips:**

- Flatten complex shapes before exporting
- Use "Outline stroke" for text
- Keep layers organised — layer names become IDs

### Illustrator

1. File → Export → Export As
2. Format: SVG
3. Click "SVG Options"

**Recommended settings:**

- Styling: Presentation Attributes (not inline CSS)
- Font: Convert to Outlines
- Images: Embed
- Object IDs: Layer Names (or Minimal)
- Decimal Places: 2
- Minify: Yes
- Responsive: Yes (removes width/height)

### Sketch

1. Select layer/artboard
2. File → Export
3. Format: SVG

**Tips:**

- Use "Make Exportable" on specific layers
- Check "Include in Export" only for what you need

---

## Manual Optimisation Techniques

Sometimes you need to hand-edit:

### Remove Unnecessary Attributes

```svg
<!-- Before -->
<path fill="#000000" stroke="none" stroke-width="1" fill-rule="evenodd" d="..."/>

<!-- After (defaults are black fill, no stroke) -->
<path d="..."/>
```

### Simplify Colours

```svg
<!-- Before -->
<rect fill="#ffffff"/>

<!-- After -->
<rect fill="#fff"/>

<!-- Or use named colours when shorter -->
<rect fill="red"/>  <!-- shorter than #f00 or #ff0000 -->
```

### Round Coordinates

```svg
<!-- Before -->
<circle cx="12.00000381" cy="12.00000381" r="9.99999619"/>

<!-- After -->
<circle cx="12" cy="12" r="10"/>
```

### Remove Empty Groups

```svg
<!-- Before -->
<g>
  <g>
    <circle cx="12" cy="12" r="10"/>
  </g>
</g>

<!-- After -->
<circle cx="12" cy="12" r="10"/>
```

### Use Shorthand Path Commands

```svg
<!-- Before: absolute coordinates -->
<path d="M 0 0 L 10 0 L 10 10 L 0 10 Z"/>

<!-- After: relative + shortcuts -->
<path d="M0 0h10v10H0z"/>
```

---

## Building an Icon System

### File Structure

```
icons/
├── src/           # Original SVGs from design tool
├── optimised/     # After SVGO
├── sprite.svg     # Combined sprite
└── icons.js       # Optional: JS exports
```

### Build Script

```json
{
  "scripts": {
    "icons:optimise": "svgo -f ./icons/src -o ./icons/optimised",
    "icons:sprite": "svg-sprite --symbol --dest ./icons ./icons/optimised/*.svg",
    "icons:build": "npm run icons:optimise && npm run icons:sprite"
  }
}
```

### Automated Sprite Generation

Using `svg-sprite`:

```bash
npm install -g svg-sprite
svg-sprite --symbol --dest ./dist ./icons/*.svg
```

---

## Performance Best Practices

### 1. Keep File Size Small

- Target under 10KB for icons
- Target under 50KB for illustrations
- Consider JPEG/WebP for complex images

### 2. Limit DOM Complexity

Each SVG element is a DOM node. Thousands of paths = slow rendering.

```svg
<!-- Bad: 500 individual circles -->
<circle cx="10" cy="10" r="1"/>
<circle cx="12" cy="10" r="1"/>
<!-- ... 498 more -->

<!-- Better: single path or pattern -->
<pattern id="dots">...</pattern>
<rect fill="url(#dots)"/>
```

### 3. Use CSS for Repeated Styles

```svg
<!-- Bad: repeated inline styles -->
<path fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
<path fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
<path fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>

<!-- Good: CSS class -->
<style>.line { fill: #3b82f6; stroke: #1d4ed8; stroke-width: 2; }</style>
<path class="line"/>
<path class="line"/>
<path class="line"/>
```

### 4. Lazy Load Off-Screen SVGs

```html
<img src="illustration.svg" loading="lazy" alt="..." />
```

### 5. Avoid Expensive Filters

Blur, drop-shadow, and displacement filters are GPU-intensive. Use sparingly, especially on mobile.

---

## Accessibility Checklist

Before shipping, verify:

- [ ] Meaningful SVGs have `<title>` or `aria-label`
- [ ] Complex graphics have `<desc>`
- [ ] Decorative SVGs have `aria-hidden="true"`
- [ ] Icon buttons have accessible names
- [ ] Interactive SVGs are keyboard accessible

---

## Common Workflow

1. **Design** in Figma/Illustrator
2. **Export** as SVG with good settings
3. **Optimise** with SVGO/SVGOMG
4. **Review** — hand-edit if needed
5. **Add accessibility** — title, desc, ARIA
6. **Integrate** — inline, sprite, or img tag
7. **Test** — check rendering, performance, accessibility

---

## Debugging SVGs

### SVG Not Showing?

- Check `viewBox` matches content bounds
- Check `width`/`height` aren't zero
- Check `fill` isn't `none` or transparent
- Check element isn't clipped or masked
- Check browser dev tools for errors

### SVG Looks Wrong?

- Check `preserveAspectRatio` setting
- Check for transform issues
- Compare in multiple browsers
- Validate at [W3C Validator](https://validator.w3.org/)

### Performance Issues?

- Check DOM node count (aim for < 1000)
- Check for expensive filters
- Profile in browser dev tools
- Consider rasterising complex artwork

---

## Resources

**Tools:**

- [SVGOMG](https://jakearchibald.github.io/svgomg/) — Visual SVGO
- [SVG Path Editor](https://yqnn.github.io/svg-path-editor/) — Edit paths visually
- [URL Encoder](https://yoksel.github.io/url-encoder/) — SVG to CSS background

**Libraries:**

- [GSAP](https://greensock.com/gsap/) — Professional animation
- [anime.js](https://animejs.com/) — Lightweight animation
- [Snap.svg](http://snapsvg.io/) — SVG manipulation

**Learning:**

- [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [CSS-Tricks SVG Guide](https://css-tricks.com/lodge/svg/)
- [Sara Soueidan's Blog](https://www.sarasoueidan.com/blog/)

---

## Exercises

### Exercise 24.1: Optimise an Icon

Export an icon from Figma or download one from the web. Run it through SVGO and compare before/after file sizes.

### Exercise 24.2: Build a Mini Sprite

Create a sprite file with 3 icons. Use them on a test page with `<use>`.

### Exercise 24.3: Performance Audit

Find a complex SVG online. Check its DOM node count and identify what could be simplified.

### Exercise 24.4: Full Workflow

Design a simple icon in Figma, export it, optimise it, add accessibility, and use it in HTML.

---

## Course Complete! 🎉

You've covered everything from basic shapes to production-ready optimisation. You now know how to:

- Create and style SVG graphics from scratch
- Draw complex shapes with path commands
- Animate with CSS, SMIL, and JavaScript
- Apply gradients, patterns, masks, and filters
- Add text and flow it along paths
- Build reusable icon systems
- Make SVGs accessible
- Optimise for production

### What's Next?

- **Practice** — Build real things. Icons, illustrations, data visualisations.
- **Explore libraries** — GSAP, anime.js, D3.js for complex projects
- **Study the masters** — Inspect SVGs on sites you admire
- **Share your work** — Your SVG journey could help others

Happy creating! 🚀
