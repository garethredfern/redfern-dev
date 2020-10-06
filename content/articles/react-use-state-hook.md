---
title: Learn About React useState Hook
description: "Lets break down how React's useState hook works in it's simplest form."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1601969094/redfern-dev/png/react.png"
tags: ["React"]
published: "2020-10-04"
---

## React useState Hook

```js
function Counter() {
  const [count, setCount] = React.useState(0);

  const increment = () => setCount(count + 1);

  return <button onClick={increment}>{count}</button>
}
```

`React.useState` is a function that accepts a single argument. That argument is the initial state for the instance of the component. In our case, the state starts as `0`.

`React.useState` returns a pair of values. It does this by returning an array with two elements (and we use destructuring syntax to assign each of those values to distinct variables).

```js
const array = React.useState(0);
const count = array[0]; // state value
const setCount = array[1]; // set state function

// OR use destructuring
const [count, setCount] = React.useState(0);
```

The first of the pair is the state value and the second is a function we can call to update the state. We can name these variables whatever we want. Common convention is to choose a name for the state variable, then prefix `set` in front of that for the updater function.

State can be defined as: data that changes over time. So, how does this work over time? When the button is clicked, our `increment` function will be called at which time we update the `count` by calling `setCount`.

Calling `setCount` tells React to re-render our component. When it does this, the entire `Counter` function is re-run, so when `React.useState` is called this time, the value we get back is the value that we called `setCount`with. And it continues like that until `Counter` is unmounted (removed from the application), or the user closes the application.

These notes are taken from the excellent [Epic React](https://epicreact.dev) course, by Kent C. Dodds.