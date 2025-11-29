---
title: "Passing Arguments in Javascript"
description: "You can pass arguments into functions to be used within the function. These arguments can be any JavaScript data type including functions."
tags: ["javascript"]
pubDate: "2016-04-10T09:00:00Z"
link: "passing-arguments-in-javascript"
---

## Passing Arguments in Javascript

You can pass arguments into functions to be used within the function. These arguments can be any JavaScript data type including functions.

- We create an `ifElse` function which has a condition of `true` or `false` passed into it, 2 functions and 1 argument to be used in those functions.
- Notice that `funcOne` and `funcTwo` both take an argument of `x` which is console logged when they are called.
- We call the `ifElse` function and pass in `true` as the condition, the two functions and a string of `myArg`.
- The condition is `true` so `isTrue` is called and the `myArg` string gets console logged as it was passed in via the `arg` argument.

```js
var ifElse = function (condition, isTrue, isFalse, arg) {
  if (condition) {
    isTrue(arg); // this is called, passing in the myArg string
  } else {
    isFalse(arg);
  }
};

var funcOne = function (x) {
  console.log(x);
};

var funcTwo = function (x) {
  console.log(x);
};

ifElse(true, funcOne, funcTwo, "myArg");
```
