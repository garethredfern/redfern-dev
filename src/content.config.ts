import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    published: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    permalink: z.string().optional(),
  }),
});

// Expose your defined collection to Astro
// with the `collections` export
export const collections = { articles };
