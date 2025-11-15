---
title: "JavaScript Promises"
description: "JavaScript Promises are used in most modern web applications where we need to do some work that takes some time to complete. A popular example of this is fetching data from an API, where the result is needed to be displayed in your app."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599832342/redfern-dev/png/js.png"
tags: ["JavaScript"]
published: "2020-08-16"
permalink: "javascript-promises"
---

## JavaScript Promises

JavaScript Promises are used in most modern web applications where we need to do some work that takes some time to complete. A popular example of this is fetching data from an API, where the result is needed to be displayed in your app.

Using a Promise allows you to go and fetch the data, while still carrying on with other tasks before the data is returned. They can be a little tricky to understand at first, but once you get the fundamentals it will help you with API development work.

Here we have a basic `setTimeout` function which console logs "Timer complete..." after 2 seconds. Because `setTimeout` takes some time to execute, it is an asynchronous function. The `console.log` that follows it is synchronous because it runs straight away.

When JavaScript runs, it is "non-blocking", what this means is that `setTimeout` will run but the code will not wait for it to finish before "Hey there!" is console logged.

```js
setTimeout(() => {
  console.log("Timer complete...");
}, 2000);

console.log("Hey there!");
```

So imagine that you need an asynchronous function to run and fetch some data from an API, the data that is returned is used in a second function. There may well be a delay in fetching the data from the API so you need to make sure that this function has completed before running the second function which uses the "response".

How can we achieve this? The answer is by using a Promise.

```js
const fetchData = () => {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("Data fetched...");
    }, 2000);
  });
  return promise;
};

const logData = (data) => {
  console.log(data);
};

fetchData()
  .then((response) => {
    logData(response);
  })
  .catch((error) => {
    console.log(error);
  });
```

View on [CodePen](https://codepen.io/garethredfern/pen/qBZONRM)

In the above code we have the fetchData function which creates a new Promise object using a constructor function. Don't worry too much if you don't understand what a constructor function does, just remember:

> The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value.

Inside the promise we run our asynchronous code which will complete some time in the future. Take note of the resolve method passed into the Promise as an argument. The resolve and reject methods can be called anything you like but it's common to see them named resolve and reject. The resolve method will run on success and the reject method will run if there is an error fetching the data.

> The resolve method "returns" the data we need, the fetchData function returns the promise NOT the data.

### Breaking It Down

`fetchData`gets called, within it a new Promise is created with the asynchronous `setTimeout` running to fetch some data. This data is returned at some point in the future (2 seconds). The Promise is returned allowing any other code to run (non-blocking). When the data fetching has completed,`fetchData` uses the `.then` method chained onto it to call`logData`and display the data.

### Catching Errors

We can chain a second `.catch`method after the `.then` where any errors can be caught and handled either by logging them or showing a more specific message to the user.
