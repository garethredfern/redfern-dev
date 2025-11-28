---
title: "Basic Module Pattern JavaScript"
description: "Wrap your code in an immediately invoked function expression (IFFE). It runs immediately when you create it and has no name."
tags: ["javascript"]
published: "2016-04-10"
permalink: "basic-module-pattern-javascript"
---

## Basic Module Pattern JavaScript

Wrap your code in an immediately invoked function expression (IFFE). It runs immediately when you create it and has no name. Normally you would create a IFFE like this:

```js
(function () {
  // your code
})();
```

It is common practice to remove the outer wrapping parenthesis and use a `!` or `+` at the start of the anonymous function:

```js
!(function () {
  function foo() {
    console.log("foobar");
  }

  foo();
})();
```

You can pass a variable into the IFFE so that it can be used within its local scope. Here I am passing in the underscore library using `_` to be used within the module.

```js
!(function (underscore) {
  console.log(underscore.VERSION);
})(_);
```

You can name the passed in variable (parameter) whatever you like so while you would normally use the underscore library by using `_` you can now use it within the local scope using underscore. variable.

Another use might be to pass in the window object and create a variable called global within your IFFE. Now you can access the global scope by using the global variable.

```js
var bar = "foo";

!(function (global) {
  console.log(global.bar); // foo
})(window);
```
