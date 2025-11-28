---
title: "Lambda Expressions vs Anonymous Functions"
description: "When learning a functional programming style you will often come across the term Lambda Expressions or Lambda Functions. In simple terms they are just functions that can be used as data and therefore declared as a value. Let's explore a few examples."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599832342/redfern-dev/png/js.png"
tags: ["javascript"]
published: "2020-08-29"
permalink: "lambda-expressions-vs-anonymous-functions"
---

## Lambda Expressions vs Anonymous Functions

When learning a functional programming style you will often come across the term **Lambda Expressions** or **Lambda Functions**. In simple terms they are just functions that can be used as data and therefore declared as a value. Let's explore a few examples.

Consider this array of users where each user is stored as an object.

```js
const users = [
  { id: "💻", name: "Gareth", skill: "coder" },
  { id: "🎧", name: "Danny", skill: "DJ" },
  { id: "🕺🏼", name: "Barry", skill: "dancer" },
];
```

### Named Function Declaration

We can use a function declaration to create a named function that can be passed to another function to retrieve some data.

```js
function getUserSkills(user) {
  return user.skill;
}

console.log(users.map(getUserSkills));
```

### Anonymous Functions

You will often see and use anonymous functions as callbacks in other functions. Here we are retuning just the user’s skills as a new array of data. These are great for small tasks where you quickly want to grab some data.

```js
console.log(
  users.map(function (user) {
    return user.skill;
  })
);
```

### Lambda Expression

A Lambda expression is an anonymous function assigned to a variable. Here we assign an ES6 anonymous function to the `getUserSkills` variable. We can then pass the value of `getUserSkills` to be used as data elsewhere in our application. They become really useful when you want to split out more complex functionality into more readable and reusable functions.

```js
const getUserSkills = (user) => user.skill;

console.log(users.map(getUserSkills));
```

View on [CodePen](https://codepen.io/garethredfern/pen/JjXJWgK)
