import async from "async";
import { generateOpenGraphImageForTheme } from "../src/components/themeOpenGraph";
import { themesLoader } from "../src/themesLoader";

(async () => {
  const [, , ...themeIds] = process.argv;
  const themesFromArguments = themeIds;
  const allThemes = await themesLoader();

  await async.parallelLimit(
    allThemes
      .filter((t) => themesFromArguments.includes(t.id))
      .map((t) => {
        return async () => {
          const res = (await generateOpenGraphImageForTheme(t))
            .png()
            .toFile(`public/themes-opengraph/${t.urlBase}.png`);

          return res;
        };
      }),
    20,
  );
})();
