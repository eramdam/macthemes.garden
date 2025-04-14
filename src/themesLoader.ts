import crypto from "node:crypto";
import themesKaleidoscopeAirtable from "./themes/airtable.json" with { type: "json" };
import themesKaleidoscopeBot from "./themes/original.json" with { type: "json" };
import slugify from "slugify";

const mySlugify = (str: string) => slugify(str, { remove: /[*+~.()'"!:@\/]/g });

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
        authors: makeAuthorsFromAuthorsString(theme.authors || ""),
        year: theme.year,
        thumbnails: [theme.ksaSampler, theme.about, theme.showcase].map((t) =>
          t.replace("public/", "/"),
        ),
        mainThumbnail: theme.ksaSampler.replace("public/", "/"),
        archiveFile: theme.archiveFilename,
        urlBase: mySlugify(`${theme.name}`),
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
          authors: makeAuthorsFromAuthorsString(theme.authors || ""),
          archiveFile: theme.archiveFilename,
          thumbnails: theme.thumbnails,
          mainThumbnail: theme.thumbnails[0],
          slug: theme.archiveFilename.replace(".sit", ""),
          urlBase: mySlugify(`${theme.name}`),
        };
      }),
    );
  return result;
}

export async function themeAuthorsLoader() {
  const airtableAuthors = new Set(
    themesKaleidoscopeAirtable
      // @ts-expect-error
      .concat(themesKaleidoscopeBot)
      .flatMap((t) => {
        return makeAuthorsFromAuthorsString(t.authors || "");
      })
      .filter((a) => !!a)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  );

  return Array.from(airtableAuthors).map((a) => {
    return { name: a, id: a, slug: slugify(a), url: `/authors/${slugify(a)}` };
  });
}

function makeAuthorsFromAuthorsString(authors: string) {
  return (authors || "")
    .split(/(?:and |,|&)/)
    .map((l) => l.trim().replaceAll(`'`, `"`))
    .filter((a) => !!a);
}
