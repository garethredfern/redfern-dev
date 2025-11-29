---
title: "JavaScript Objects"
description: "JavaScript objects are used everywhere. It's an important concept to understand right from the beginning."
tags: ["javascript"]
pubDate: "2016-04-10T09:00:00Z"
link: "javascript-objects"
---

## JavaScript Objects

In this example we are storing the object's properties by value. What this means is that `cb` is stored in memory, when you change the value of box.material to Steel it doesn't change the value of `cb`. Both the `console.log(cb);` will display cardboard as `cb` has stored the value cardboard in memory.

```js
var box = {};

box.material = "Cardboard";

var cb = box.material;

console.log(cb);

box.material = "Steel";

console.log(cb);
```

For more Javascript learning check out my [CodePen JS collection](https://codepen.io/collection/paujy/).
