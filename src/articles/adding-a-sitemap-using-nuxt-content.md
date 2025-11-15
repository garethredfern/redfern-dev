---
title: Adding a Sitemap Using Nuxt Content
description: Here is how to add a sitemap to your Nuxt project when using the content module.
image: https://res.cloudinary.com/redfern-web/image/upload/v1599840408/redfern-dev/png/nuxt.png
tags:
  - VueJS
  - Nuxt
published: '2020-09-01'
permalink: "adding-a-sitemap-using-nuxt-content"
---

## Adding a Sitemap Using Nuxt Content

Nuxt Content is a first party module which enables you to serve markdown files (and other file types) as content for your website. There is an excellent [article](https://nuxtjs.org/blog/creating-blog-with-nuxt-content/) written by Debbie O'Brian on the Nuxt blog which I recommend reading. It provides all the necessary information to get you up and running with a blog. One area that isn't touched on is adding a sitemap and the necessary social meta tags, in this post I will take you through how I added a sitemap and in a [follow-up post](/articles/adding-social-media-seo-meta-data-using-nuxt-content) we add all the necessary social media meta tags.

Nuxt has its own [sitemap module](https://www.npmjs.com/package/@nuxtjs/sitemap) that you can easily install. A sitemap tells search engines how the pages of your website are structured. This will make your site indexable, and search engines will be able to see the pages. While it may not necessarily improve SEO you can submit your sitemap through tools such as the [Google Search Console](https://search.google.com/search-console/about) to get reports on what the search engine robots see when they crawl your site. Let's dive into setting everything up.

### Install @nuxtjs/sitemap

Add the Nuxt sitemap module [@nuxtjs/sitemap](https://www.npmjs.com/package/@nuxtjs/sitemap), once you have it downloaded in your project, add it in the modules section of your `nuxt.config.js`. It is recommended that you always add it at the end of your modules array.

```js
modules: [
  "@nuxt/content",
  "@nuxtjs/sitemap",
],
```

### Configuration

You will need to add the sitemap configuration object in your `nuxt.config.js` file. I suggest adding it right after the build object in the `export default` but it could go anywhere just so long as it's within the `export default`.

```js
export default {
  // ... other config items
  build: {},
  sitemap: {},
};
```

Next add the hostname which you can either hard-code as a string, or I suggest using an environment variable which holds your full site URL.

```js
export default {
  sitemap: {
    hostname: process.env.BASE_URL, // https://www.yoursite.com
  },
};
```

There is more configuration you can add, but to keep things simple the last thing we will add are the site routes. This will basically tell the sitemap module every page you want to list in your sitemap. By default, static pages are automatically picked up by the module, so there is no work to do there. For dynamic routes (e.g. `articles/_slug.vue`), you have to declare them with the `routes` property. This option can be an array or a function, here we will need to use a function, as this will automatically populate the sitemap every time you post a new article.

To keep things tidy create an `utils` folder in the route of your project, within that add a `getRoutes.js` file. You can name these whatever you like but I like to have an `utils` folder for holding all my helper functions. Inside `getRoutes.js` add the following code, which I found in the official [Nuxt Content docs](https://content.nuxtjs.org/advanced#static-site-generation). If you have read through the docs, it should be fairly easy to understand. We export an `async` function which hooks into the content module and returns the full path of each file in your `content` folder.

```js
export default async () => {
  const { $content } = require("@nuxt/content");
  const files = await $content({ deep: true }).only(["path"]).fetch();

  return files.map((file) => (file.path === "/index" ? "/" : file.path));
};
```

In your `nuxt.config.js` make sure to import the `getRoutes` helper method at the top of your file (outside the `export default`).

```js
import getRoutes from "./utils/getRoutes";
```

Finally, you can call the `getRoutes` method in the `routes` method of the sitemap object. Make sure you copy the code as shown below, **note** that you return the result of calling getRoutes which will return you all the content paths.

```js
sitemap: {
  hostname: process.env.BASE_URL,
  routes() {
    return getRoutes();
  },
},
```

With this all in place running `npm run generate` should create a `dist` folder in the root of your project, within that folder there should be a `sitemap.xml` file. Once you publish your site, you will be able to visit <https://www.yoursite.com/sitemap.xml> to see the sitemap. Go ahead and visit <https://redfern.dev/sitemap.xml> for an example showing the sitemap for this site.
