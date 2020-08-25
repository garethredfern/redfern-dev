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
      { name: "referrer", content: "none-when-downgrade" },
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
        content: "https://www.redfern.dev/",
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
        content: "https://www.redfern.dev/content/images/2020/05/logo-3.png",
      },
      { property: "og:image:width", content: "740" },
      { property: "og:image:height", content: "300" },
      { name: "twitter:site", content: "@garethredfern" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        hid: "twitter:url",
        name: "twitter:url",
        content: "https://www.redfern.dev/",
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
        content: "https://www.redfern.dev/content/images/2020/05/logo-2.png",
      },
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        hid: "canonical",
        rel: "canonical",
        href: "https://www.redfern.dev/",
      },
    ],
  },
  /*
   ** Global CSS
   */
  css: [],
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
  ],
  /*
   ** Content module configuration
   ** See https://content.nuxtjs.org/configuration
   */
  content: {},
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {},
};
