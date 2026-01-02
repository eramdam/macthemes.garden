import { defineAction } from "astro:actions";
import { z } from "astro:content";
import { getPaletteForTheme } from "../helpers/thumbnailHelpers";
import { themesLoader } from "../themesLoader";

const themes = await themesLoader({ colors: false, relatedThemes: false });
const possibleIds = new Set(themes.map((t) => t.id));

const zodThemeId = z.string().refine(
  (rawString) => {
    return possibleIds.has(rawString);
  },
  {
    message: "String is not a valid theme ID",
  },
);

export const server = {
  debugPalette: defineAction({
    accept: "json",
    input: z.object({
      themeId: zodThemeId,
    }),
    handler: async (input) => {
      if (!import.meta.env.DEV) {
        return undefined;
      }
      const theme = themes.find((t) => t.id === input.themeId);
      if (!theme) {
        return undefined;
      }

      const palette = await getPaletteForTheme(theme);

      return { palette, thumbnail: theme.mainThumbnail };
    },
  }),
};

if (!import.meta.env.DEV) {
  // @ts-expect-error
  delete server.debugPalette;
}
