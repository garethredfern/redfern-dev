---
title: "Factory Function To Create An Object In JavaScript"
description: "Use a constructor function that returns an object. You can then create multiple people passing in the first and last name arguments the `createPerson` function."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599832342/redfern-dev/png/js.png"
tags: ["JavaScript"]
published: "2016-04-09"
permalink: "factory-function-to-create-an-object-in-javascript"
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
