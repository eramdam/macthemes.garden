import { spawn } from "node:child_process";
import { themesLoader } from "../src/themesLoader";
import { cpus } from "node:os";
import { chunk } from "lodash-es";
import { execaSync } from "execa";

(async () => {
  const listOfChangedFiles = execaSync({
    lines: true,
  })`git ls-files --modified --others public/themes/attachments`.stdout;
  if (listOfChangedFiles.length < 1) {
    console.log("No images changed, no need to re-generate them");
    return;
  }
  const themes = await themesLoader();
  const threadsCount = cpus().length;
  const themesToUpdate = themes.filter((t) => {
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
  });
})();
