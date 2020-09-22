const defaultTheme = require("tailwindcss/defaultTheme");
/*
 ** TailwindCSS Configuration File
 **
 ** Docs: https://tailwindcss.com/docs/configuration
 ** Default: https://github.com/tailwindcss/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      rotate: {
        1: "1deg",
        "-1": "-1deg",
        2: "2deg",
        "-2": "-2deg",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/ui"), require("@tailwindcss/typography")],
  purge: {
    // Learn more on https://tailwindcss.com/docs/controlling-file-size/#removing-unused-css
    enabled: process.env.NODE_ENV === "production",
    content: [
      "components/**/*.vue",
      "layouts/**/*.vue",
      "pages/**/*.vue",
      "plugins/**/*.js",
      "nuxt.config.js",
    ],
  },
};
