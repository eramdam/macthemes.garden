import { themesLoader } from "../src/themesLoader";
import sharp from "sharp";
import path from "node:path";

(async () => {
  const themes = await themesLoader({
    colors: false,
    relatedThemes: false,
  });

  for (const theme of themes) {
    const thumbnailsToValidate = theme.thumbnails.filter(
      (t) => String(t).includes("about-") || String(t).includes("showcase-"),
    );

    for (const thumbnail of thumbnailsToValidate) {
      const s = sharp(path.join("public", thumbnail));
      const metadata = await s.metadata();

      if (metadata.width < 800 || metadata.height < 600) {
        console.info(`[INFO] ${theme.name} has invalid thumbnail ${thumbnail}`);
      }
    }
  }
})();
