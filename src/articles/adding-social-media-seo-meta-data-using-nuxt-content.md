---
title: Adding Social Media & SEO Meta Data Using Nuxt Content
description: "Here is how to add social media and SEO meta data to your Nuxt project when using the content module."
tags: ["vue", "nuxt"]
pubDate: "2020-09-17T09:00:00Z"
link: "adding-social-media-seo-meta-data-using-nuxt-content"
---

## Adding Social Media & SEO Meta Data Using Nuxt Content

In the [previous article](/articles/adding-a-sitemap-using-nuxt-content) we added a sitemap to our Nuxt blog using the content module. Now it’s time to add all the important head tags to the main and post templates.

Let’s start with the main site meta data, which will be used in the main template and would also be used as a fallback if any other individual pages do not have the meta content added to them. In the `nuxt.config.js` file there is a [head property](https://nuxtjs.org/api/configuration-head), it is here where we will be adding all our data.

### Title Tag

```js
head: {
  title: "My Amazing Blog on The Joy of Painting";
}
```

This is the main title which will show in search engines, you can read more about how it’s used in SEO over on the [Moz site](https://moz.com/learn/seo/title-tag). The title can be overridden in other templates by adding different content:

- title: "My Amazing Blog on The Joy of Painting"
- title: “How to Paint Landscape Paintings”

Next the meta data, I will break it up into a few parts to help explain what it does but if you just want to see the whole thing, then feel free to copy and paste from the gist at the end of this article (obviously change the details to your own).

### Description Tag

```js
head: {
  title: "My Amazing Blog on The Joy of Painting",
  meta: [
    {
      hid: "description",
      name: "description",
      content:
        "Articles focused on the beautiful art of landscape painting.",
    }
  ]
}
```

An important thing to understand is the `hid` property. Using this allows you to override the tag in other templates. For example, using `hid: description` on the main template, will allow you to override the description on the post template. If you do not add `hid: description` then the tag will be duplicated. The only exception to this is the title tag mentioned previously. If you want to read more on the SEO description tag, check out the [Moz Site](https://moz.com/learn/seo/meta-description).

### Open Graph Data

[Open Graph](https://ogp.me/) data is used by Facebook and other social media platforms to provide rich links to your content. Each property should be fairly self-explanatory and notice we again use the `hid` Nuxt property so that we can override this content in other templates. Add the following code to your meta tag array:

```js
meta: [
  { property: "og:site_name", content: "I Love Painting" },
  { hid: "og:type", property: "og:type", content: "website" },
  {
    hid: "og:url",
    property: "og:url",
    content: "https://bobross.com",
  },
  {
    hid: "og:title",
    property: "og:title",
    content: "My Amazing Blog on The Joy of Painting",
  },
  {
    hid: "og:description",
    property: "og:description",
    content: "Articles focused on the beautiful art of landscape painting.",
  },
  {
    hid: "og:image",
    property: "og:image",
    content: "/a-lovely-image.png",
  },
  { property: "og:image:width", content: "740" },
  { property: "og:image:height", content: "300" },
];
```

### Twitter Card

Twitter has its own set of sharing tags called [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards), adding these will display your tweets in a format that is more noticeable and can be embedded/shared in other web content.

<client-only>
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Here&#39;s a quick post on adding a sitemap to a <a href="https://twitter.com/nuxt_js?ref_src=twsrc%5Etfw">@nuxt_js</a> site using the content module.<a href="https://t.co/elTgrp37Fp">https://t.co/elTgrp37Fp</a></p>&mdash; Gareth Redfern (@garethredfern) <a href="https://twitter.com/garethredfern/status/1300823052633223169?ref_src=twsrc%5Etfw">September 1, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</client-only>

Add the following code to your meta tag array:

```js
meta: [
  { name: "twitter:site", content: "@bobross" },
  { name: "twitter:card", content: "summary_large_image" },
  {
    hid: "twitter:url",
    name: "twitter:url",
    content: "https://bobross.com",
  },
  {
    hid: "twitter:title",
    name: "twitter:title",
    content: "My Amazing Blog on The Joy of Painting",
  },
  {
    hid: "twitter:description",
    name: "twitter:description",
    content: "Articles focused on the beautiful art of landscape painting.",
  },
  {
    hid: "twitter:image",
    name: "twitter:image",
    content: "/a-loveley-image.png",
  },
];
```

### Adding a Canonical Link

While not part of the meta tag, it is also important to have a [canonical tag](https://moz.com/learn/seo/canonicalization) on each page of your site. Within the `head` property of your `nuxt.config.js` file, after the meta array, add the following code:

```js
link: [
  {
    hid: "canonical",
    rel: "canonical",
    href: "https://bobross.com",
  },
];
```

Again, we use the `hid` property so that we can override this on each article page.

#### The Full Config Code

> Here is a gist with the [complete code](https://gist.github.com/garethredfern/bc3108a44d5e6bdd6de2121e774612bc) that will go in your `nuxt.config.js` file.

### The Single Post Template

Everything we have done so far goes in the `nuxt.config.js` file, and it will show on every page of your site. This is definitely not what we want for our posts as they will have their own meta data to display. First let’s look at a simple way to add what we need to our post template. If you have followed the article on [creating a blog with Nuxt content](https://nuxtjs.org/blog/creating-blog-with-nuxt-content), you will have a post template called `_slug`. In this template we need to add our [head method code](https://nuxtjs.org/api/pages-head/) that overrides the `nuxt.config.js` head code.

There are some additional tags that we can use on a post to help provide even more meta data benefits:

```js
{
  property: "article:published_time",
  content: this.article.createdAt,
},
{
  property: "article:modified_time",
  content: this.article.updatedAt,
},
{
  property: "article:tag",
  content: this.article.tags ? this.article.tags.toString() : "",
},
{ name: "twitter:label1", content: "Written by" },
{ name: "twitter:data1", content: "Bob Ross" },
{ name: "twitter:label2", content: "Filed under" },
{
  name: "twitter:data2",
  content: this.article.tags ? this.article.tags.toString() : "",
}
```

You will also need to update the canonical link tag too:

```js
link: [
  {
    hid: "canonical",
    rel: "canonical",
    href: `https://bobross.com/articles/${this.$route.params.slug}`,
  },
];
```

#### The Full Post Template Code

> Here is a gist of the [complete code](https://gist.github.com/garethredfern/e81bfda1a10d08e2277cdd1d7c660034) that goes in your `_slug.vue ` template.

### Refactor & Remove Duplicate Code

As you may have noticed, we are duplicating quite a bit of meta data code in the `nuxt.config.js` and `_slug.vue` template. We can refactor things to help keep things DRY.

Start by creating a `getSiteMeta.js` file in an `utils` folder in your `src` directory. This file will export a function which returns the meta data that we want to share across the site. The function excepts an object where we pass in any overrides for the description, type etc.

```js
export default (meta) => {
  return [
    {
      hid: "description",
      name: "description",
      content: (meta && meta.description) || description,
    },
    {
      hid: "og:type",
      property: "og:type",
      content: (meta && meta.type) || type,
    },
    {
      hid: "og:url",
      property: "og:url",
      content: (meta && meta.url) || url,
    },
    {
      hid: "og:title",
      property: "og:title",
      content: (meta && meta.title) || title,
    },
    {
      hid: "og:description",
      property: "og:description",
      content: (meta && meta.description) || description,
    },
    {
      hid: "og:image",
      property: "og:image",
      content: (meta && meta.mainImage) || mainImage,
    },
    {
      hid: "twitter:url",
      name: "twitter:url",
      content: (meta && meta.url) || url,
    },
    {
      hid: "twitter:title",
      name: "twitter:title",
      content: (meta && meta.title) || title,
    },
    {
      hid: "twitter:description",
      name: "twitter:description",
      content: (meta && meta.description) || description,
    },
    {
      hid: "twitter:image",
      name: "twitter:image",
      content: (meta && meta.mainImage) || mainImage,
    },
  ];
};
```

At the top of `getSiteMeta.js`, above the export, we can set the default meta data which will be used on the home page and as a fallback.

```js
const type = "website";
const url = "https://bobross.com";
const title = "My Amazing Blog on The Joy of Painting";
const description =
  "Articles focused on the beautiful art of landscape painting.";
const mainImage = "/a-lovely-image.png";
```

Here is a gist of the [complete code](https://gist.github.com/garethredfern/b79c3f95ceb82f213e2d68ce7b5fae5b).

Using the `getSiteMeta` method in both the `next.config.js` and `_slug.vue` template will enable us to clean up the duplicate code. Add the following to the top of your `next.config.js` file:

```js
import getSiteMeta from "./utils/getSiteMeta";

const meta = getSiteMeta();
```

Then the head property can be reduced to the following code. _Notice_ we spread in the meta returned from `getSiteMeta()` using `...meta`.

```js
head: {
  htmlAttrs: {
    lang: "en-GB",
  },
  title: "My Amazing Blog on The Joy of Painting",
  meta: [
    ...meta,
    { charset: "utf-8" },
    { name: "HandheldFriendly", content: "True" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { property: "og:site_name", content: "Bob Ross" },
    {
      hid: "description",
      name: "description",
      content:
        "Articles focused on the beautiful art of landscape painting.",
    },
    { property: "og:image:width", content: "740" },
    { property: "og:image:height", content: "300" },
    { name: "twitter:site", content: "@bobross" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    {
      hid: "canonical",
      rel: "canonical",
      href: process.env.BASE_URL,
    },
  ]
}
```

Finally, in the `_slug` template we create a computed property to build our meta data array to spread into the `head` property of this template:

```js
computed: {
  meta() {
    const metaData = {
      type: "article",
      title: this.article.title,
      description: this.article.description,
      url: `${this.$config.baseUrl}/articles/${this.$route.params.slug}`,
      mainImage: this.article.image,
    };
    return getSiteMeta(metaData);
  }
}
```

Then spread in the meta array into the `head` property:

```js
head() {
  return {
    title: this.article.title,
    meta: [
      ...this.meta,
      {
        property: "article:published_time",
        content: this.article.createdAt,
      },
      {
        property: "article:modified_time",
        content: this.article.updatedAt,
      },
      {
        property: "article:tag",
        content: this.article.tags ? this.article.tags.toString() : "",
      },
      { name: "twitter:label1", content: "Written by" },
      { name: "twitter:data1", content: "Bob Ross" },
      { name: "twitter:label2", content: "Filed under" },
      {
        name: "twitter:data2",
        content: this.article.tags ? this.article.tags.toString() : "",
      },
    ],
    link: [
      {
        hid: "canonical",
        rel: "canonical",
        href: `https://bobross.com/articles/${this.$route.params.slug}`,
      },
    ],
  };
}
```

### Conclusion

We have written quite a lot of code to get everything in place but you now have a dynamic blog which will have all the correct SEO tags and look good when shared on social media. All the code in this article and the previous one for [building a sitemap](/articles/adding-a-sitemap-using-nuxt-content) can be seen in this [Nuxt starter theme](https://github.com/garethredfern/nuxt-basic-blog), if you have any questions, feel free to [hit me up on Twitter](https://twitter.com/garethredfern).
