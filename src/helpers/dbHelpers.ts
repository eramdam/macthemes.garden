import { compact, memoize, uniq } from "lodash-es";

async function getCombinedLikesFromSocials() {
  const mastodonLikes = await import("../../src/themes/likes-mastodon.json");
  const blueskyLikes = await import("../../src/themes/likes-bsky.json");
  const combinedLikes = compact(
    uniq([
      ...Object.keys(mastodonLikes.likes),
      ...Object.keys(blueskyLikes.likes),
    ]).map((themeId) => {
      // @ts-expect-error
      const fromMasto = mastodonLikes.likes[themeId] ?? 0;
      // @ts-expect-error
      const fromBluesky = blueskyLikes.likes[themeId] ?? 0;

      if (fromMasto + fromBluesky < 1) {
        return undefined;
      }

      return [themeId, fromMasto + fromBluesky];
    }),
  ) as [string, number][];

  let likesCountById: Record<string, number> = {};

  combinedLikes.forEach((pair) => {
    const [themeId, likes] = pair;
    likesCountById[themeId] = likes;
  });

  return likesCountById;
}

async function _getLikeCountsByThemeIds(): Promise<Record<string, number>> {
  let likesCountById: Record<string, number> = {};
  const remoteLikesById = await getCombinedLikesFromSocials();

  Object.entries(remoteLikesById).forEach(([id, remoteLikesCount]) => {
    likesCountById[id] = (likesCountById[id] || 0) + remoteLikesCount;
  });

  return likesCountById;
}

export const getLikeCountsByThemeIds = memoize(_getLikeCountsByThemeIds);

export async function getLikesCountForThemeId(themeId: string) {
  return (await getLikeCountsByThemeIds())[themeId] || 0;
}
