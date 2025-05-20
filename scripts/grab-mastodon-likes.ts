import fs from "fs-extra";

// File generated daily
const stats = await fetch(
  "https://social.erambert.me/macthemes-posts-stats.json",
);
const statsObject = (await stats.json()) as {
  text: string;
  reblogs_count: number;
  favourites_count: number;
}[];

const urlRegex = new RegExp("https://macthemes.garden/themes/[a-z0-9]+", "i");
const likesByThemeIds = statsObject
  .map((obj) => {
    const urlInText = obj.text.match(urlRegex);
    if (!urlInText?.[0]) {
      return undefined;
    }

    const urlMatch = urlInText[0];
    const themeId = new URL(urlMatch).pathname
      .split("/")
      .pop()
      ?.split("-")
      .shift();
    if (!themeId) {
      return undefined;
    }
    return { ...obj, themeId };
  })
  .filter(Boolean)
  .reduce((prev, curr) => {
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
  }, {});

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
