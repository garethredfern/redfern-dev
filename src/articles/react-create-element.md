---
title: Learn About React createElement
description: "Lets break down how React's createElement method works in it's simplest form."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1601969094/redfern-dev/png/react.png"
tags: ["react"]
published: "2020-10-03"
permalink: "react-create-element"
---

## React createElement
In its simplest form we can use `React.createElement()` to replace `document.createElement('div')` this allows us to create elements and provides a simple API for adding attributes and text to the created element.

```js
const rootElement = document.getElementById('root');

const elementProps = {
	className: 'container',
	children: 'Hello world'
};

const reactElement = React.createElement('div', elementProps);

ReactDOM.render(reactElement, rootElement);
```

### Nesting Elements
The `children` property can be an array of elements that we want  to pass into the “parent” element, here we just create two separate elements `helloElement` and `worldElement` and pass them into the children array.

```js
const rootElement = document.getElementById('root');

const helloElement = React.createElement('span', {}, 'Hello');
const worldElement = React.createElement('span', {}, 'World');

const elementProps = {
	className: 'container',
	children: [helloElement, worldElement]
};

const reactElement = React.createElement('div', elementProps);

ReactDOM.render(reactElement, rootElement);
```

These notes are taken from the excellent [Epic React](https://epicreact.dev) course, by Kent C. Dodds.