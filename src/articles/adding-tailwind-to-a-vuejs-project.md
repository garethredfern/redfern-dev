---
title: "Adding Tailwind To a VueJS Project"
description: "Simple instructions for setting up Tailwind CSS in your VueJS projects."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1598516539/redfern-dev/png/tailwind.png"
tags: ["vue", "tailwind"]
published: "2019-12-03"
permalink: "adding-tailwind-to-a-vuejs-project"
---

## Adding Tailwind To a VueJS Project

Here is my set up for installing [Tailwind CSS](https://tailwindcss.com/) into a VueJs project.

Install your VueJS project using the [CLI as normal](https://cli.vuejs.org/guide/creating-a-project.html#vue-create).

Create a `postcss.config.js` file in the root of your project and add the following code:

```js
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [
    tailwindcss("./tailwind.config.js"),
    autoprefixer({
      add: true,
      grid: true,
    }),
  ],
};
```

Create a `tailwind.config.js` file in the root of your project and add the following code (optional you don't have to add this):

```js
module.exports = {
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".trans": {
          transition: "all .25s",
        },
        ".trans-bg": {
          transition: "property background",
        },
        ".trans-slow": {
          transition: "duration .5s",
        },
        ".trans-slower": {
          transition: "duration .5s",
        },
        ".trans-fast": {
          transition: "duration .15s",
        },
        ".trans-faster": {
          transition: "duration .075s",
        },
      };
      addUtilities(newUtilities);
    },
  ],
  theme: {
    fontFamily: {
      sans: ["Open Sans", "sans-serif"],
    },
  },
};
```

Create a `main.css` file in the src directory of your project, I usually add it to `/src/assets/css/main.css` then add the following:

```css
@tailwind base;

@tailwind components;

@tailwind utilities;
```

In your `main.js` file add the following at the top of the file: `import "@/assets/css/main.css";`

Run the `serve` command from the Vue CLI and test that you have tailwind injected into your page.
