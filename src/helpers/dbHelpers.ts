import { and, db, eq, Like, LikesCount, UserRequest } from "astro:db";
import { getSecret } from "astro:env/server";
import { compact, groupBy, mapValues, memoize, uniq } from "lodash-es";
import { v4, v5 } from "uuid";

export async function getUserLikeStatusForTheme(
  userId: string,
  themeId: string,
) {
  return (
    (
      await db
        .select()
        .from(Like)
        .where(and(eq(Like.userId, userId), eq(Like.themeId, themeId)))
    ).length > 0
  );
}

export async function addLikeForThemeFromUserId(
  userId: string,
  themeId: string,
) {
  await db.insert(Like).values({
    id: v4(),
    themeId: themeId,
    userId,
  });
  await updateLikesCountTable();
}

export async function removelikeForThemeFromUserId(
  userId: string,
  themeId: string,
) {
  const currentCount = (
    await db.select().from(LikesCount).where(eq(LikesCount.themeId, themeId))
  )[0].count;

  // Special case when going from `1` to `0` to avoid inconsistencies.
  if (currentCount === 1) {
    await db.delete(LikesCount).where(eq(LikesCount.themeId, themeId));
  }
  await db
    .delete(Like)
    .where(and(eq(Like.themeId, themeId), eq(Like.userId, userId)));
  await updateLikesCountTable();
}

async function updateLikesCountTable() {
  console.time("updateLikesCountTable");
  const likedThemes = await db.select().from(Like);
  const countsById = mapValues(
    groupBy(likedThemes, (l) => l.themeId),
    (g) => g.length,
  );

  const transactions = Object.entries(countsById).map(([key, count]) => {
    return db
      .insert(LikesCount)
      .values({ themeId: key, count: count })
      .onConflictDoUpdate({
        target: LikesCount.themeId,
        set: {
          count: count,
        },
      });
  });

  // @ts-expect-error
  await db.batch(transactions);
  console.timeEnd("updateLikesCountTable");
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
  return await db
    .insert(UserRequest)
    .values({ userId, date: new Date() })
    .onConflictDoUpdate({
      target: UserRequest.userId,
      set: {
        date: new Date(),
      },
    })
    .values();
}

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
  console.time("getLikeCountsByThemeIds");
  const likesCount = await db.select().from(LikesCount);
  let likesCountById: Record<string, number> = {};
  const remoteLikesById = await getCombinedLikesFromSocials();

  for (const likeCountRow of likesCount) {
    likesCountById[likeCountRow.themeId] = likeCountRow.count;
  }

  Object.entries(remoteLikesById).forEach(([id, remoteLikesCount]) => {
    likesCountById[id] = (likesCountById[id] || 0) + remoteLikesCount;
  });

  console.timeEnd("getLikeCountsByThemeIds");
  return likesCountById;
}

export const getLikeCountsByThemeIds = memoize(_getLikeCountsByThemeIds);

export async function getLikesCountForThemeId(themeId: string) {
  return (await getLikeCountsByThemeIds())[themeId] || 0;
}
