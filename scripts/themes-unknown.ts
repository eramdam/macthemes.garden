import { compact } from "lodash-es";
import themesKaleidoscopeBot from "../src/themes/original.json" with { type: "json" };
import { themesLoader } from "../src/themesLoader";

const themes = await themesLoader();

const themesWithNoAuthors = themes.filter((t) => {
  return t.authors.length < 1;
});
const matchesFromBot = compact(
  themesKaleidoscopeBot.map((t) => {
    return (
      themesWithNoAuthors.find((noAuthor) => {
        return noAuthor.archiveFile === t.archiveFilename;
      }) && t
    );
  }),
);
console.log(matchesFromBot);
