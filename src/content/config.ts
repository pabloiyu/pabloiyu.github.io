import { defineCollection, z } from "astro:content";

const tiles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    diagram: z.string(),
  }),
});

export const collections = { tiles };
