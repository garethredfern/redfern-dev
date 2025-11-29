---
title: "Using JavaScript To Access URL Segments"
description: "Whilst working on a recent project, I wanted an accordion navigation to remain open depending on what the category segment in the url was displaying."
tags: ["javascript"]
pubDate: "2020-06-19T09:00:00Z"
link: "using-javascript-to-access-url-segments"
---

## Using JavaScript To Access URL Segments

Whilst working on a recent project, I wanted an accordion navigation to remain open depending on what the category segment in the url was displaying. To do this I found a simple bit of JavaScript published on [CSS-Tricks](http://css-tricks.com/snippets/javascript/get-url-and-url-parts-in-javascript) which looks like this:

Get the full URL path:

```js
const newURL =
  window.location.protocol +
  "://" +
  window.location.host +
  "/" +
  window.location.pathname;
```

Next split the segments of the URL using:

```js
const pathArray = window.location.pathname.split("/");
```

Finally select the segment you require using:

```js
const segment_1 = pathArray[1];
```

The above code would select `segment_1` but you can see how you can easily select `segment_2`,`segment_3` etc.

Once these segments are stored in variables it is really easy to set states for your navigation.

```js
const nav = document.getElementById("nav");

if (segment_2 === "category") {
  nav.querySelector("li ul:not(:first-child)").classList.add("is-hidden");
}
```

If you like this article and want to learn more about Javascript, I have started a [series of posts](http://codepen.io/collection/paujy/) on CodPen.
