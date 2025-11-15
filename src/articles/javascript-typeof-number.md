---
title: "JavaScript typeof Number"
description: "Often you will need to check that you have a number before using it in your JavaScript, here's how."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599832342/redfern-dev/png/js.png"
tags: ["JavaScript"]
published: "2020-08-28"
permalink: "javascript-typeof-number"
---

## JavaScript typeof Number

Often you will need to check that you have a number before using it in your JavaScript, here's how.

```js
typeof 77; // number
77 instanceof Number; // false
Object.prototype.toString.call(77) === "[object Number]";
```

First you can use the `typeof` operator on any number either floating point or integer and if it’s a number and either `true` will be returned if the value is a number.

```js
console.log(typeof 77); // number
```

OK, job done! There are a couple of other ways to check for numbers though one of which should be avoided.

The `Number` constructor in JavaScript is used for working with numbers and the Number() function can be used to convert values to numbers. However, calling `77 instanceof of Number;` returns `false` as 77 is a **literal value** not an **instance of** the Number constructor.

```js
console.log(77 instanceof Number); // false
```

Finally, you can use the `call` method on `Object.prototype.toString` which will always return `[[object Number]` if you pass a number into the call method.

```js
Object.prototype.toString.call(77); // '[object Number]'
```

The above can be used for type checking any primitive and is considered one of the safest ways of type checking although for numbers `typeof` works just fine.

```js
Object.prototype.toString.call(77); // '[object Number]'
Object.prototype.toString.call("hi"); // '[object String]'
Object.prototype.toString.call(["hi"]); // '[object Array]'
Object.prototype.toString.call({ greet: "hi" }); // '[object Object]'
```
