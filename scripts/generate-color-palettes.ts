import path from "path";
import quantize, { type RgbPixel } from "quantize";
import sharp from "sharp";
import { themesLoader } from "../src/themesLoader";
import fs from "fs-extra";

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

async function getPaletteForTheme(
  theme: Awaited<ReturnType<typeof themesLoader>>[number],
) {
  const thumbnailSharp = sharp(path.join("public", theme.mainThumbnail));
  const [red, green, blue] = await Promise.all([
    thumbnailSharp.extractChannel("red").raw().toBuffer(),
    thumbnailSharp.extractChannel("green").raw().toBuffer(),
    thumbnailSharp.extractChannel("blue").raw().toBuffer(),
  ]);
  let pixels: RgbPixel[] = [];
  for (let index = 0; index < red.length; index++) {
    pixels[index] = [red[index], green[index], blue[index]];
  }
  const colorMap = quantize(pixels, 6);

  return colorMap ? colorMap.palette() : undefined;
}
