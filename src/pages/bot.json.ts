import { getCollection, getEntries } from "astro:content";

export async function GET() {
  const themes = await getCollection("themes");
  const themesWithAuthorsPromise = themes.map(async (t) => {
    return {
      ...t,
      data: {
        ...t.data,
        authors: (await getEntries(t.data.authors)).map((a) => a.data),
      },
    };
  });
  const themesWithAuthors = (await Promise.all(themesWithAuthorsPromise)).map(
    (t) => t.data,
  );
  const json = JSON.stringify(themesWithAuthors);

  return new Response(json);
}
