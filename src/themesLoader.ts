import crypto from "node:crypto";
import themesKaleidoscopeAirtable from "./themes/airtable.json" with { type: "json" };
import themesKaleidoscopeBot from "./themes/original.json" with { type: "json" };
import slugify from "slugify";

export async function themesLoader() {
  const botThemesNotOnAirtableYet = themesKaleidoscopeBot.filter((theme) => {
    return themesKaleidoscopeAirtable.every((themeAirtable) => {
      return themeAirtable.archiveFilename !== theme.archiveFilename;
    });
  });

  const result = themesKaleidoscopeAirtable
    .map((theme) => {
      const id = crypto
        .createHash("shake256", { outputLength: 6 })
        .update(
          [theme.name, theme.authors, theme.year, theme.archiveFilename].join(
            "-",
          ),
        )
        .digest("hex");

      if (!theme.ksaSampler) {
        console.log(theme);
      }
      return {
        id,
        name: theme.name,
        authors: theme.authors,
        year: theme.year,
        thumbnails: [theme.ksaSampler, theme.about, theme.showcase].map((t) =>
          t.replace("src/", "/"),
        ),
        mainThumbnail: theme.ksaSampler.replace("src/", "/"),
        archiveFile: theme.archiveFilename,
        urlBase: slugify(`${theme.name}-${id}`),
      };
    })
    .concat(
      botThemesNotOnAirtableYet.map((theme) => {
        const id = crypto
          .createHash("shake256", { outputLength: 6 })
          .update([theme.name, theme.authors, theme.archiveFilename].join("-"))
          .digest("hex");
        return {
          id,
          name: theme.name,
          year: undefined,
          authors: theme.authors,
          archiveFile: theme.archiveFilename,
          thumbnails: theme.thumbnails,
          mainThumbnail: theme.thumbnails[0],
          slug: theme.archiveFilename.replace(".sit", ""),
          urlBase: slugify(`${theme.name}-${id}`),
        };
      }),
    );
  return result;
}
