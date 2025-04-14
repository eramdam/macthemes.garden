// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";

// 2. Import loader(s)
import { themesLoader } from "./themesLoader";

const themes = defineCollection({
  loader: themesLoader,
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { themes };
