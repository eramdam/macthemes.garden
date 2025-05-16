// 1. Import utilities from `astro:content`
import { defineCollection, getCollection, reference, z } from "astro:content";
import { memoize } from "lodash-es";

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
    isAirtable: z.boolean(),
    isNew: z.boolean(),
    relatedThemes: z.array(reference("themes")),
    createdAt: z.date(),
    likes: z.number().default(0),
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

export const getCollectionStats = memoize(async () => {
  return {
    themes: (await getCollection("themes")).length,
    authors: (await getCollection("authors")).length,
  };
});
