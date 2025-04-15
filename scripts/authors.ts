import themesKaleidoscopeBot from "../src/themes/original.json" with { type: "json" };
import themesKaleidoscopeAirtable from "../src/themes/airtable.json" with { type: "json" };

const airtableAuthors = new Set(
  themesKaleidoscopeAirtable
    .concat(themesKaleidoscopeBot)
    .flatMap((t) => {
      return (t.authors || "")
        .split(/(?:and |,|&)/)
        .map((l) => l.trim().replaceAll(`'`, `"`));
    })
    .filter((a) => !!a)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
);
