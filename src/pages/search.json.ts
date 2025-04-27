import { getCollection, getEntries } from "astro:content";
import { pick } from "lodash-es";

export async function GET() {
  const themes = await getCollection("themes");
  const themesWithAuthorsPromise = themes.map(async (t) => {
    return {
      ...t,
      data: {
        ...t.data,
        authors: (await getEntries(t.data.authors)).map((a) =>
          pick(a.data, ["name", "url"]),
        ),
      },
    };
  });
  const themesWithAuthors = (await Promise.all(themesWithAuthorsPromise)).map(
    (t) =>
      pick(t.data, [
        "urlBase",
        "mainThumbnail",
        "name",
        "year",
        "isNew",
        "authors",
      ]),
  );

  const json = JSON.stringify(themesWithAuthors);

  return new Response(json);
}
