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
  const resizedSharp = thumbnailSharp
    .resize({
      width: width / 4,
      kernel: "nearest",
    })
    .png();
  const [red, green, blue, alpha] = await Promise.all([
    resizedSharp.extractChannel("red").raw().toBuffer(),
    resizedSharp.extractChannel("green").raw().toBuffer(),
    resizedSharp.extractChannel("blue").raw().toBuffer(),
    resizedSharp.extractChannel("alpha").raw().toBuffer(),
  ]);
  let pixels: RgbPixel[] = [];

  for (let index = 0; index < red.length; index++) {
    if (alpha[index] > 0) {
      pixels[index] = [red[index], green[index], blue[index]];
    }
  }
  pixels = pixels.filter(Boolean);
  const colorMap = quantize(pixels, 12);
  if (!colorMap) {
    return undefined;
  }

  const paletteColors = colorMap.palette();
  const colorScores = new WeakMap<RgbPixel, number>();

  for (const pixel of pixels) {
    const mappedPixel = getReducedPixel(pixel, colorMap);
    const existingPixelScore = colorScores.get(mappedPixel);
    const isGrayscale =
      mappedPixel[0] === mappedPixel[1] && mappedPixel[1] === mappedPixel[2];
    const isVeryDark =
      mappedPixel[0] < 30 && mappedPixel[1] < 30 && mappedPixel[2] < 30;
    const scoreBonus = isGrayscale || isVeryDark ? 1 : 4;
    if (!existingPixelScore) {
      colorScores.set(mappedPixel, 1 * scoreBonus);
    } else {
      colorScores.set(mappedPixel, existingPixelScore + 1 * scoreBonus);
    }
  }

  return orderBy(
    // For some reason `quantize` returns pixel values from 1-256? I think?? So I need to -1 everything lmao.
    paletteColors.map((p) => p.map((n) => n - 1)),
    (p) => {
      return colorScores.get(p) ?? 0;
    },
    "desc",
  );
}

const getReducedPixel = (pixel: RgbPixel, colorMap: quantize.ColorMap) => {
  return colorMap.map(pixel);
};
