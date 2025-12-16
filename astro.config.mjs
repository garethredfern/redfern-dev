// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
  },

  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://redev.rocks",
  integrations: [sitemap(), mdx()],
});
