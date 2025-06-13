import rss, { type RSSFeedItem } from "@astrojs/rss";
import {
  getCollection,
  getEntries,
  type ReferenceDataEntry,
} from "astro:content";
import { renderFeedTheme } from "../components/feedTheme";
import type { APIContext } from "astro";
import { formatAuthorsText } from "../components/authorsFormatter";
import { orderBy } from "lodash-es";

export async function GET(context: APIContext) {
  const themes = await getCollection("themes");
  const limitedThemes = orderBy(themes, (t) => t.data.createdAt, [
    "desc",
  ]).slice(0, 100);
  const items = await Promise.all(
    limitedThemes.map(async (theme) => {
      return {
        title: theme.data.name,
        link: `/themes/${theme.data.urlBase}`,
        pubDate: new Date(theme.data.createdAt),
        content: await renderFeedTheme(theme.data, context.site!),
        author: await makeAuthorsString(theme.data.authors),
      } satisfies RSSFeedItem;
    }),
  );
  return rss({
    title: "Mac Themes Garden",
    description: "Newly added themes to Mac Themes Garden",
    site: context.site!,
    items: items,
    trailingSlash: false,
  });
}

async function makeAuthorsString(
  authors: ReferenceDataEntry<"authors", string>[],
) {
  const fullAuthors = (await getEntries(authors)).map((a) => a.data);
  const authorsList = fullAuthors.map((a) => a.name);
  return formatAuthorsText(authorsList);
}
