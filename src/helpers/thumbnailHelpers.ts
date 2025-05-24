import path from "path";
import quantize, { type RgbPixel } from "quantize";
import sharp from "sharp";
import type { themesLoader } from "../themesLoader";
import { orderBy } from "lodash-es";

export async function getPaletteForTheme(
  theme: Awaited<ReturnType<typeof themesLoader>>[number],
) {
  const thumbnailSharp = sharp(path.join("public", theme.mainThumbnail));
  const { width } = await thumbnailSharp.metadata();
  const resizedSharp = thumbnailSharp.resize(width / 4);
  const [red, green, blue] = await Promise.all([
    resizedSharp.extractChannel("red").raw().toBuffer(),
    resizedSharp.extractChannel("green").raw().toBuffer(),
    resizedSharp.extractChannel("blue").raw().toBuffer(),
  ]);
  let pixels: RgbPixel[] = [];
  for (let index = 0; index < red.length; index++) {
    pixels[index] = [red[index], green[index], blue[index]];
  }
  const colorMap = quantize(pixels, 12);
  if (!colorMap) {
    return undefined;
  }

  const paletteColors = colorMap.palette();
  const colorScores = new WeakMap<RgbPixel, number>();

  for (const pixel of pixels) {
    const mappedPixel = getReducedPixel(pixel, colorMap);
    const existingPixelScore = colorScores.get(mappedPixel);
    if (!existingPixelScore) {
      colorScores.set(mappedPixel, 1);
    } else {
      colorScores.set(mappedPixel, existingPixelScore + 1);
    }
  }

  return orderBy(
    paletteColors,
    (p) => {
      return colorScores.get(p) ?? 0;
    },
    "desc",
  );
}

const getReducedPixel = (pixel: RgbPixel, colorMap: quantize.ColorMap) => {
  return colorMap.map(pixel);
};
