import { and, count, db, eq, Like, Theme, UserRequest } from "astro:db";
import { getSecret } from "astro:env/server";
import { chunk, compact, flatten, memoize, uniq } from "lodash-es";
import { v5 } from "uuid";
import pMemoize from "p-memoize";
import ExpiryMap from "expiry-map";
import { millisecondsInMinute } from "date-fns/constants";

export async function getLikeForUserIdAndTheme(
  userId: string,
  themeId: string,
) {
  return db
    .select()
    .from(Like)
    .where(and(eq(Like.userId, userId), eq(Like.themeId, themeId)));
}

export function generateUserUUID(ip: string) {
  return v5(ip, getSecret("UUID_NAMESPACE") || "");
}

export async function getLastRequestFromUserId(userId: string) {
  return await db
    .select()
    .from(UserRequest)
    .where(eq(UserRequest.userId, userId));
}

export async function recordLastRequestFromUserId(userId: string) {
  const needsUpdate = (await getLastRequestFromUserId(userId)).length > 0;

  if (needsUpdate) {
    return await db
      .update(UserRequest)
      .set({ userId, date: new Date() })
      .values();
  }

  return await db
    .insert(UserRequest)
    .values({ userId, date: new Date() })
    .values();
}

async function getCombinedLikes() {
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

async function _getLikeCountsByThemeIds() {
  console.log("getLikesCountForThemeId");
  const likedThemesIds = (await db.select().from(Theme)).map((t) => t.id);
  let likesCountById: Record<string, number> = {};
  for (const themeIdsChunk of chunk(likedThemesIds, 400)) {
    const transactions = themeIdsChunk.map((id) => {
      return db
        .select({ [id]: count() })
        .from(Like)
        .where(eq(Like.themeId, id));
    });

    // @ts-expect-error
    const results = flatten(await db.batch(transactions));

    results.forEach((r) => {
      likesCountById = {
        ...likesCountById,
        ...r,
      };
    });
  }

  const remoteLikesById = await getCombinedLikes();

  Object.entries(remoteLikesById).forEach(([id, likesCount]) => {
    likesCountById[id] = (likesCountById[id] || 0) + likesCount;
  });

  return likesCountById;
}

const likesPerIdCache = new ExpiryMap(millisecondsInMinute * 3);
export function clearLikesPerIdCache() {
  likesPerIdCache.clear();
}

export async function getLikesCountForThemeId(themeId: string) {
  return (await getLikeCountsByThemeIds())[themeId] || 0;
}

export const getLikeCountsByThemeIds = pMemoize(_getLikeCountsByThemeIds, {
  cache: likesPerIdCache,
});
