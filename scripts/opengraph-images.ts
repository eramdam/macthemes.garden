import { spawn } from "node:child_process";
import { themesLoader } from "../src/themesLoader";
import { cpus } from "node:os";
import { chunk, keyBy } from "es-toolkit";
import { execaSync } from "execa";
import fs from "node:fs";

const CACHE_PATH = "./themes-map-cache.json";

(async () => {
  const ignoreChanges = true;
  const listOfChangedFiles = execaSync({
    lines: true,
  })`git ls-files --modified --others public/themes/attachments`.stdout;
  if (!ignoreChanges && listOfChangedFiles.length < 1) {
    console.log("No images changed, no need to re-generate them");
    return;
  }
  const themes = await themesLoader({ colors: false, relatedThemes: false });
  const allThemesMap = keyBy(themes, (t) => t.id);
  await fs.promises.writeFile(CACHE_PATH, JSON.stringify(allThemesMap));
  const threadsCount = cpus().length;
  const themesToUpdate = ignoreChanges
    ? themes
    : themes.filter((t) => {
        return t.thumbnails.some((thumb) => {
          return listOfChangedFiles
            .map((l) => l.replace("public/", "/"))
            .includes(thumb);
        });
      });
  const themesChunks = chunk(
    themesToUpdate,
    Math.ceil(themes.length / threadsCount),
  );

  themesChunks.forEach((themeChunk) => {
    const proc = spawn(`npx`, [
      "tsx",
      "--no-warnings",
      "scripts/opengraph-images-base.ts",
      ...themeChunk.map((t) => t.id),
    ]);

    proc.stdout.on("data", (data) => console.log(data.toString()));
    proc.stderr.on("data", (data) => console.log(data.toString()));
  });
})();
