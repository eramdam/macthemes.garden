import fs from "fs-extra";
import { type RgbPixel } from "quantize";
import { getPaletteForTheme } from "../src/helpers/thumbnailHelpers";
import { themesLoader } from "../src/themesLoader";

(async () => {
  const themes = await themesLoader();
  const themeIdToPalette: Record<string, RgbPixel[]> = {};
  for (const theme of themes) {
    const palette = await getPaletteForTheme(theme);
    if (palette) {
      themeIdToPalette[theme.id] = palette;
    }
  }

  await fs.writeFile(
    new URL(import.meta.resolve("../src/themes/palettes.json")).pathname,
    JSON.stringify(themeIdToPalette),
    "utf-8",
  );
})();
