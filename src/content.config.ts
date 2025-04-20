// 1. Import utilities from `astro:content`
import { defineCollection, reference, z } from "astro:content";

// 2. Import loader(s)
import { themeAuthorsLoader, themesLoader } from "./themesLoader";

const themes = defineCollection({
  loader: themesLoader,
  schema: z.object({
    name: z.string(),
    authors: z.array(reference("authors")),
    year: z.string().optional(),
    mainThumbnail: z.string(),
    thumbnails: z.array(z.string()),
    archiveFile: z.string(),
    urlBase: z.string(),
  }),
});

const authors = defineCollection({
  loader: themeAuthorsLoader,
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    url: z.string(),
    themes: z.array(reference("themes")),
  }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { themes, authors };
