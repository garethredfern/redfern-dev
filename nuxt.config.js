import getRoutes from "./utils/getRoutes";
import getSiteMeta from "./utils/getSiteMeta";

const meta = getSiteMeta();

export default {
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
      class: "bg-gradient-to-r from-teal-400 to-blue-500",
    },
    title: "Articles focused on learning Laravel and VueJS",
    meta: [
      ...meta,
      { charset: "utf-8" },
      { name: "HandheldFriendly", content: "True" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:site_name", content: "Redfern Dev" },
      {
        hid: "description",
        name: "description",
        content:
          "Articles focused on learning the Laravel and VueJS frameworks with some good old fashioned JavaScript thrown in.",
      },
      { property: "og:image:width", content: "740" },
      { property: "og:image:height", content: "300" },
      { name: "twitter:site", content: "@garethredfern" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    link: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "alternate icon", href: "/favicon.ico" },
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
  plugins: [],
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
    "vue-plausible",
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
    const baseLinkFeedArticles = "/articles";
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
