---
title: "Understanding Closures In JavaScript"
description: "This example shows how you create a closure in JavaScript it uses an alert function that can be incremented and reused/passed around."
tags: ["javascript"]
pubDate: "2016-03-29T09:00:00.000Z"
permalink: "understanding-closures-in-javascript"
---

## Understanding Closures In JavaScript

This example shows how you create a closure in JavaScript it uses an alert function that can be incremented and reused/passed around.

### The Problem

The following code will alert the number 3 three times. You may have expected it to alert 0,1,2 (don't forget JavaScript is zero based).

```js
var a = {};
for (var i = 0; i < 3; i++) {
    a[i] = function() {
    alert(i);
};

a[0](); // 3
a[1](); // 3
a[2](); // 3
```

What happens to cause this behaviour is the loop runs once and sets the `a[i]` property to the function which will alert `i`:

```js
a[i] = function () {
  alert(i);
};
```

The loop repeats 3 times (because of `i < 3`). Then the function stored at each property of a gets run (using `a[0]()`) etc. The `i` argument passed into alert is now 3 because the loop has run three times and the variable `i`in global scope is set to 3.

```js
a[0](); // 3
a[1](); // 3
a[2](); // 3
```

### The Solution

To get around this you can set an IFFE around the internal function:

```js
var a = {};
for (var i = 0; i < 3; i++) {
    (function(j) {
    a[j] = function() {
    alert(j);
   };
}(i));

a[0](); // 3
a[1](); // 3
a[2](); // 3
```

What this does is provide a closure around the `j` variable which means that the loop will iterate three times using `i` then the value of `i` is passed into the IFFE as the parameter `j` for each iteration. Because a function closure is now provided by the IFFE around the variable `j` it will not be global and therefore is set to the loop iteration number as you would expect resulting in:

```js
a[0](); // 0
a[1](); // 1
a[2](); // 2
```

If you enjoyed this post I have a [collection of JS learning examples](https://codepen.io/collection/paujy/) CodePen.
