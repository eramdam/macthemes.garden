import { defineCollection, getCollection, reference, z } from "astro:content";
import { memoize } from "lodash-es";

import {
  getPaletteForThemeId,
  targetPaletteColors,
} from "./helpers/paletteHelpers";
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
    colors: z.array(reference("paletteColors")),
    createdAt: z.date(),
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

const paletteColors = defineCollection({
  loader: async () => {
    const themes = await themesLoader();
    let themesIdsByColor: Record<string, string[]> = {};

    for (const theme of themes) {
      const paletteForTheme = getPaletteForThemeId(theme.id) || [];
      for (const paletteColor of paletteForTheme) {
        if (paletteColor.hex) {
          if (themesIdsByColor[paletteColor.hex]) {
            themesIdsByColor[paletteColor.hex].push(theme.id);
          } else {
            themesIdsByColor[paletteColor.hex] = [theme.id];
          }
        }
      }
    }

    return targetPaletteColors.map((color) => {
      return {
        id: color[0],
        name: color[1],
        hex: color[0],
        themes: themesIdsByColor[color[0]],
      };
    });
  },
  schema: z.object({
    name: z.string(),
    hex: z.string(),
    themes: z.array(reference("themes")),
  }),
});

export const collections = { themes, authors, paletteColors };

export const getCollectionStats = memoize(async () => {
  return {
    themes: (await getCollection("themes")).length,
    authors: (await getCollection("authors")).length,
  };
});
