---
title: "JavaScript Async Await"
description: "Working with JavaScript Promises you have a couple of approaches to consider for interacting with the response. The Promise doesn't give you the response in the exact format you can work with, let's dive in and explore things."
tags: ["javascript"]
pubDate: "2020-08-21T09:00:00.000Z"
link: "javascript-async-await"
---

## JavaScript Async Await

Working with JavaScript Promises you have a couple of approaches to consider for interacting with the response. The Promise doesn't give you the response in the exact format you can work with, let's dive in and explore things.

### Using then & catch

The use of `.then` and `.catch` allow you to flow through your code, when the Promise is resolved, do something with the returned data.

```js
asyncFunction()
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error);
  });
```

The `.then` and `.catch` methods both except callback functions where you can interact with the returned data from the Promise. You can chain as many `.then` methods as you need, handy when you need to fetch data, wait, then run the same function again. Note you only need one `.catch` at the end to handle any error encountered in the `.then` chain.

```js
const asyncFunction = (name) => {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`Data ${name} fetched...`);
    }, 2000);
  });
  return promise;
};

asyncFunction("One")
  .then((response) => {
    console.log(response); // Data One fetched...
    return asyncFunction("Two");
  })
  .then((asyncFunction) => {
    console.log(asyncFunctionOne); // Data Two fetched...
  })
  .catch((error) => {
    console.log(error);
  });
```

View on [CodePen](https://codepen.io/garethredfern/pen/abNBwMZ)

### Async Await

Building on the previous example, async await offers a different syntax which can be easier to read when you have lots of functions you need to wait for. The key to understanding how it works is **you need mark a function “wrapper” as `async`** within that function you then mark each function that returns a Promise as `await`.

Imagine the wrapper function is the kitchen and it has lots of meals to cook for a table, it needs to deliver these meals all together but you have to `await` until each meal is ready before the waiter serves all the meals to the table.

```js
const cookMeal = (order, timeToCook) => {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`Cooked ${order} ready...`);
    }, timeToCook);
  });
  return promise;
};

async function serveAllMeals() {
  const mealOne = await cookMeal("Salmon", 2000);
  const mealTwo = await cookMeal("Pasta", 3000);
  console.log(mealOne);
  console.log(mealTwo);
}

serveAllMeals();
```

View on [CodePen](https://codepen.io/garethredfern/pen/KKzNdzG)

### Catching Errors

There are a few options for catching errors but the one I like to use is chaining the `.catch` on the end of the function marked `async` when you call it.

```js
async function serveAllMeals() {
  const mealOne = await cookMeal("Salmon", 2000);
  const mealTwo = await cookMeal("Pasta", 3000);
  console.log(mealOne);
  console.log(mealTwo);
}

serveAllMeals().catch((error) => {
  // chain the .catch method
  console.log(error);
});
```

The above error catching works because when you mark a function as `async` it too will return a promise.
