import fs from "fs-extra";
import prettier from "prettier";
import { type RgbPixel } from "quantize";
import { getPaletteForTheme } from "../src/helpers/thumbnailHelpers";
import { themesLoader } from "../src/themesLoader";

(async () => {
  const themes = await themesLoader({
    colors: false,
    relatedThemes: false,
  });
  const themeIdToPalette: Record<string, RgbPixel[]> = {};
  for (const theme of themes) {
    const palette = await getPaletteForTheme(theme);
    if (palette) {
      themeIdToPalette[theme.id] = palette;
    }
  }

  await fs.writeFile(
    new URL(import.meta.resolve("../src/themes/palettes.json")).pathname,
    await prettier.format(JSON.stringify(themeIdToPalette), {
      parser: "json",
    }),
    "utf-8",
  );
})();
