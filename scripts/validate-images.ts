import { themesLoader } from "../src/themesLoader";
import sharp from "sharp";
import path from "node:path";

(async () => {
  const themes = await themesLoader({
    colors: false,
    relatedThemes: false,
  });

  for (const theme of themes) {
    const thumbnailsToValidate = theme.thumbnails;

    for (const thumbnail of thumbnailsToValidate) {
      const s = sharp(path.join("public", thumbnail));
      const metadata = await s.metadata();

      if (
        String(thumbnail).includes("about-") ||
        String(thumbnail).includes("showcase-")
      ) {
        if (metadata.width < 800 || metadata.height < 600) {
          console.info(
            `[INFO] ${theme.name} has invalid thumbnail ${thumbnail}`,
          );
        }
      } else if (String(thumbnail).includes("ksa")) {
        const [red, green, blue, alpha] = await Promise.all([
          s.extractChannel("red").raw().toBuffer(),
          s.extractChannel("green").raw().toBuffer(),
          s.extractChannel("blue").raw().toBuffer(),
          s.extractChannel("alpha").raw().toBuffer(),
        ]);
        let pixels: [number, number, number, number][] = [];

        for (let index = 0; index < red.length; index++) {
          if (alpha[index] === 255) {
            pixels.push([red[index], green[index], blue[index], alpha[index]]);
          }
        }

        if (pixels.length === alpha.length) {
          console.info(
            `[INFO] ${theme.name} has invalid thumbnail ${thumbnail}`,
          );
        }
      }
    }
  }
})();
