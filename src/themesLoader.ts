import crypto from "node:crypto";
import slugify from "slugify";
import themesKaleidoscopeAirtable from "./themes/airtable.json" with { type: "json" };
import themesKaleidoscopeBot from "./themes/original.json" with { type: "json" };

const mySlugify = (str: string) => slugify(str, { remove: /[*+~.()'"!:@\/]/g });

const archivesInAirtable = new Set(
  themesKaleidoscopeAirtable.map((t) => t.archiveFilename),
);
const botThemesNotOnAirtableYet = themesKaleidoscopeBot.filter((theme) => {
  return !archivesInAirtable.has(theme.archiveFilename);
});

export async function themesLoader() {
  const result = themesKaleidoscopeAirtable
    .map((theme) => {
      const id = crypto
        .createHash("shake256", { outputLength: 6 })
        .update([theme.name, theme.authors, theme.archiveFilename].join("-"))
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
  const themes = await themesLoader();

  const baseAuthors = new Set(
    themes
      .flatMap((t) => {
        return t.authors;
      })
      .filter((a) => !!a)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  );
  const authorsWithNumbers = Array.from(baseAuthors).map((a) => {
    return {
      author: a,
      themes: themes.filter((t) => t.authors.includes(a)).map((t) => t.id),
    };
  });

  return Array.from(authorsWithNumbers).map((a) => {
    return {
      name: a.author,
      id: a.author,
      slug: slugify(a.author),
      url: `/authors/${slugify(a.author)}`,
      themes: a.themes,
    };
  });
}

function makeAuthorsFromAuthorsString(authors: string) {
  return (authors || "")
    .split(/(?:\sand\s|,|&)/i)
    .map((l) => l.trim().replaceAll(`'`, `"`))
    .filter((a) => !!a);
}
