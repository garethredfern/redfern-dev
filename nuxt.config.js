import getRoutes from "./utils/getRoutes";

export default {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  mode: "universal",
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: "static",
  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head: {
    htmlAttrs: {
      lang: "en-GB",
    },
    title: "Articles focused on learning Laravel and VueJS",
    meta: [
      { charset: "utf-8" },
      { name: "HandheldFriendly", content: "True" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content:
          "Articles focused on learning the Laravel and VueJS frameworks with some good old fashioned JavaScript thrown in.",
      },
      { property: "og:site_name", content: "Redfern Dev" },
      { hid: "og:type", property: "og:type", content: "website" },
      {
        hid: "og:url",
        property: "og:url",
        content: process.env.BASE_URL,
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Articles focused on learning  Laravel and VueJS",
      },
      {
        hid: "og:description",
        property: "og:description",
        content:
          "Articles focused on learning the Laravel and VueJS frameworks with some good old fashioned JavaScript thrown in.",
      },
      {
        hid: "og:image",
        property: "og:image",
        content:
          "https://res.cloudinary.com/redfern-web/image/upload/v1599839846/redfern-dev/png/redfern-logo.png",
      },
      { property: "og:image:width", content: "740" },
      { property: "og:image:height", content: "300" },
      { name: "twitter:site", content: "@garethredfern" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        hid: "twitter:url",
        name: "twitter:url",
        content: process.env.BASE_URL,
      },
      {
        hid: "twitter:title",
        name: "twitter:title",
        content: "Articles focused on learning  Laravel and VueJS",
      },
      {
        hid: "twitter:description",
        name: "twitter:description",
        content:
          "Articles focused on learning the Laravel and VueJS frameworks with some good old fashioned JavaScript thrown in.",
      },
      {
        hid: "twitter:image",
        name: "twitter:image",
        content:
          "https://res.cloudinary.com/redfern-web/image/upload/v1599839846/redfern-dev/png/redfern-logo.png",
      },
    ],
    link: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        hid: "canonical",
        rel: "canonical",
        href: process.env.BASE_URL,
      },
    ],
  },
  /*
   ** Global CSS
   */
  css: ["~/assets/css/main.css"],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [{ src: "~plugins/gauges.js", mode: "client" }],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: true,
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    "@nuxtjs/eslint-module",
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    "@nuxtjs/tailwindcss",
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://github.com/nuxt/content
    "@nuxt/content",
    "@nuxtjs/feed",
    "@nuxtjs/sitemap",
  ],
  /*
   ** Content module configuration
   ** See https://content.nuxtjs.org/configuration
   */
  content: {
    markdown: {
      prism: {
        theme: "prism-themes/themes/prism-material-oceanic.css",
      },
    },
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {
    loaders: {
      vue: {
        transformAssetUrls: {
          audio: "src",
        },
      },
    },
    extend(config, ctx) {
      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]",
        },
      });
    },
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  sitemap: {
    hostname: process.env.BASE_URL,
    routes() {
      return getRoutes();
    },
  },

  feed() {
    const baseUrlArticles = `${process.env.BASE_URL}/articles`;
    const baseLinkFeedArticles = "/feed/articles";
    const feedFormats = {
      rss: { type: "rss2", file: "rss.xml" },
      json: { type: "json1", file: "feed.json" },
    };
    const { $content } = require("@nuxt/content");

    const createFeedArticles = async function (feed) {
      feed.options = {
        title: "Redfern Dev",
        description:
          "Articles focused on learning the Laravel and VueJS frameworks with some good old fashioned JavaScript thrown in.",
        link: baseUrlArticles,
      };
      const articles = await $content("articles").fetch();

      articles.forEach((article) => {
        const url = `${baseUrlArticles}/${article.slug}`;

        feed.addItem({
          title: article.title,
          id: url,
          link: url,
          date: new Date(article.published),
          description: article.description,
          content: article.description,
          author: "@garethredfern",
        });
      });
    };

    return Object.values(feedFormats).map(({ file, type }) => ({
      path: `${baseLinkFeedArticles}/${file}`,
      type,
      create: createFeedArticles,
    }));
  },

  publicRuntimeConfig: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  },
};
