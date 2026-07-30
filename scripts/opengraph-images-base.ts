import async from "async";
import fs from "node:fs";
import { generateOpenGraphImageForTheme } from "../src/components/themeOpenGraph";
import { themesLoader } from "../src/themesLoader";
import { keyBy } from "es-toolkit";

const CACHE_PATH = "./themes-map-cache.json";

(async () => {
  const [, , ...themeIds] = process.argv;
  const themesFromArguments = themeIds;
  console.time("allThemes");
  let allThemesMap:
    | Record<string, Awaited<ReturnType<typeof themesLoader>>[number]>
    | undefined = undefined;

  if (fs.existsSync(CACHE_PATH)) {
    allThemesMap = JSON.parse(await fs.promises.readFile(CACHE_PATH, "utf-8"));
  } else {
    const allThemes = await themesLoader({
      colors: false,
      relatedThemes: false,
    });
    allThemesMap = keyBy(allThemes, (t) => t.id);
  }
  await fs.promises.writeFile(CACHE_PATH, JSON.stringify(allThemesMap));
  console.timeEnd("allThemes");
  const toProcess = themesFromArguments.map((id) => allThemesMap![id]);

  await async.parallelLimit(
    toProcess.map((t) => {
      return async () => {
        const res = (await generateOpenGraphImageForTheme(t))
          .png()
          .toFile(`public/themes-opengraph/${t.urlBase}.png`);

        return res;
      };
    }),
    60,
  );
})();
