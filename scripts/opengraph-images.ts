import { spawn } from "node:child_process";
import { themesLoader } from "../src/themesLoader";
import { cpus } from "node:os";
import { chunk } from "lodash-es";
import { execaSync } from "execa";
import yargs from "yargs";
const argv = yargs(process.argv.slice(2)).parse();

(async () => {
  // @ts-expect-error
  const ignoreChanges = argv.force ?? false;
  const listOfChangedFiles = execaSync({
    lines: true,
  })`git ls-files --modified --others public/themes/attachments`.stdout;
  if (!ignoreChanges && listOfChangedFiles.length < 1) {
    console.log("No images changed, no need to re-generate them");
    return;
  }
  const themes = await themesLoader({ colors: false, relatedThemes: false });
  const threadsCount = cpus().length;
  const themesToUpdate = themes.filter((t) => {
    return t.thumbnails.some((thumb) => {
      if (ignoreChanges) {
        return true;
      }
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
