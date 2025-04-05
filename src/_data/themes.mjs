import crypto from "node:crypto";
import themesKaleidoscopeBot from "../themes/original.json" with { type: "json" };
import themesKaleidoscopeAirtable from "../themes/airtable.json" with { type: "json" };

function generateClassic() {
  const botThemesNotOnAirtableYet = themesKaleidoscopeBot.filter((theme) => {
    return themesKaleidoscopeAirtable.every((themeAirtable) => {
      return themeAirtable.archiveFilename !== theme.archiveFilename;
    });
  });

  return themesKaleidoscopeAirtable
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
        name: theme.name,
        authors: theme.authors,
        year: theme.year,
        thumbnails: [theme.ksaSampler, theme.about, theme.showcase].map((t) =>
          t.replace("src/", "/"),
        ),
        mainThumbnail: theme.ksaSampler.replace("src/", "/"),
        archiveFile: theme.archiveFilename,
        urlBase: `${theme.name}-${id}`,
      };
    })
    .concat(
      botThemesNotOnAirtableYet.map((theme) => {
        const id = crypto
          .createHash("shake256", { outputLength: 6 })
          .update(
            [theme.name, theme.authors, theme.year, theme.archiveFilename].join(
              "-",
            ),
          )
          .digest("hex");
        return {
          name: theme.name,
          year: undefined,
          authors: theme.authors,
          archiveFile: theme.archiveFilename,
          thumbnails: theme.thumbnails,
          mainThumbnail: theme.thumbnails[0],
          slug: theme.archiveFilename.replace(".sit", ""),
          urlBase: `${theme.name}-${id}`,
        };
      }),
    );

  // .sort((a, b) => a.archiveFile.localeCompare(b))
}

export const classic = generateClassic();
