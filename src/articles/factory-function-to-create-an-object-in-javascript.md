---
title: "Factory Function To Create An Object In JavaScript"
description: "Use a constructor function that returns an object. You can then create multiple people passing in the first and last name arguments the `createPerson` function."
tags: ["javascript"]
pubDate: "2016-04-09T09:00:00Z"
link: "factory-function-to-create-an-object-in-javascript"
---

## Factory Function To Create An Object In JavaScript

Use a constructor function that returns an object. You can then create multiple people passing in the first and last name arguments the `createPerson` function.

```js
var createPerson = function(firstName, lastName) {
    return {
        firstName: firstName,
        lastName: lastName,
        sayHi: function() {
        return "Hi there";
    }
};

var johnDoe = createPerson("John", "Doe");
var janeDoe = createPerson("Jane", "Doe");
```
