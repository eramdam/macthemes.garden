import fs from "fs-extra";

// File generated daily
const stats = await fetch(
  "https://social.erambert.me/macthemes-posts-stats.json",
);
const statsObject: {
  text: string;
  reblogs_count: number;
  favourites_count: number;
}[] = await stats.json();

const urlRegex = new RegExp("https://macthemes.garden/themes/([a-z0-9]+)", "i");
const likesByThemeIds = statsObject
  .map((obj) => {
    const [, themeId] = obj.text.match(urlRegex) || [];

    if (!themeId) {
      return undefined;
    }
    return { ...obj, themeId };
  })
  .filter(Boolean)
  .reduce(
    (prev, curr) => {
      if (!curr?.themeId) {
        return {};
      }
      return {
        ...prev,
        [curr?.themeId]:
          (prev[curr.themeId] || 0) +
          (curr.favourites_count || 0) +
          (curr.reblogs_count || 0),
      };
    },
    {} as Record<string, number>,
  );

await fs.writeFile(
  new URL(import.meta.resolve("../src/themes/likes-mastodon.json")).pathname,
  JSON.stringify(
    {
      likes: likesByThemeIds,
    },
    null,
    2,
  ),
  "utf-8",
);
