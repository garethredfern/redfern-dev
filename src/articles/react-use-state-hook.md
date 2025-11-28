---
title: Learn About React useState Hook
description: "Lets break down how React's useState hook works in it's simplest form."
tags: ["react"]
published: "2020-10-04"
permalink: "react-use-state-hook"
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

Here's a basic form example where state is updated when a user types in the input:

<p class="codepen" data-height="300" data-theme-id="24237" data-default-tab="js,result" data-user="garethredfern" data-slug-hash="KKMPQMx" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="React useState">
  <span>See the Pen <a href="https://codepen.io/garethredfern/pen/KKMPQMx">
  React useState</a> by Gareth Redfern (<a href="https://codepen.io/garethredfern">@garethredfern</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

These notes are taken from the excellent [Epic React](https://epicreact.dev) course, by Kent C. Dodds.