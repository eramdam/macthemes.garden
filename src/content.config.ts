// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { themesLoader } from "./themesLoader";

const themes = defineCollection({
  loader: themesLoader,
  schema: z.object({
    name: z.string(),
    authors: z.string().optional(),
    year: z.string().optional(),
    mainThumbnail: z.string(),
    thumbnails: z.array(z.string()),
    archiveFile: z.string(),
    urlBase: z.string(),
  }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { themes };
