import { spawn } from "node:child_process";
import { themesLoader } from "../src/themesLoader";
import { cpus } from "node:os";
import { chunk } from "lodash-es";

(async () => {
  const themes = await themesLoader();
  const threadsCount = cpus().length;
  const themesChunks = chunk(themes, Math.ceil(themes.length / threadsCount));

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
