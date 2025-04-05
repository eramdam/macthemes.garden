import Fetch from "@11ty/eleventy-fetch";
import fs from "fs-extra";
import { kaleidoscopeCache } from "./caches";
import path from "node:path";

(async () => {
  const kaleidoscopeCollection = await fetch(
    "https://raw.githubusercontent.com/eramdam/shapeshifter-themes/refs/heads/master/data/kaleidoscope.json",
  );
  const json = await kaleidoscopeCollection.json();
  const normalized = json.map((record) => {
    return {
      name: record.name,
      authors: record.author,
      archiveFilename: path.parse(record.download).base,
      thumbnails: record.thumbnails.map((t) => {
        return `https://raw.githubusercontent.com/eramdam/shapeshifter-themes/refs/heads/master/${t}`;
      }),
    };
  });

  kaleidoscopeCache.save(normalized, "json");

  console.log(kaleidoscopeCache.isCacheValid("1d"));

  await fs.writeFile(
    "./data/original.json",
    JSON.stringify(normalized, null, 2),
  );
})();
