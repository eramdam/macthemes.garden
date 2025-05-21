import type { AstroSharedContext } from "astro";
import { and, count, db, eq, Like, Theme, UserRequest } from "astro:db";
import { getSecret } from "astro:env/server";
import { chunk, compact, uniq } from "lodash-es";
import { v5 } from "uuid";

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

export async function getLikeCountsByThemeIds(
  session?: AstroSharedContext["session"],
): Promise<Record<string, number>> {
  console.time("fromCache");
  const fromCache = await session?.get(dbCacheKey);
  console.timeEnd("fromCache");
  if (fromCache) {
    console.log("session cache hit");
    return fromCache;
  }

  console.time("likedThemesIds");
  const likedThemesIds = (await db.select().from(Theme)).map((t) => t.id);
  console.timeEnd("likedThemesIds");
  let likesCountById: Record<string, number> = {};
  console.time("likesCountById");
  for (const themeIdsChunk of chunk(likedThemesIds, 3000)) {
    const transactions = themeIdsChunk.map((id) => {
      return db
        .select({ [id]: count() })
        .from(Like)
        .where(eq(Like.themeId, id));
    });

    console.time("db");
    // @ts-expect-error
    const results = (await db.batch(transactions)).flatMap((r) => r) as Record<
      string,
      number
    >[];
    console.timeEnd("db");

    console.time("object");
    results.forEach((r) => {
      const [id, count] = Object.entries(r)[0];
      if (likesCountById[id]) {
        likesCountById[id] += count;
      } else {
        likesCountById[id] = count;
      }
    });
    console.timeEnd("object");
  }
  console.timeEnd("likesCountById");

  const remoteLikesById = await getCombinedLikes();

  Object.entries(remoteLikesById).forEach(([id, likesCount]) => {
    likesCountById[id] = (likesCountById[id] || 0) + likesCount;
  });

  session?.set(dbCacheKey, likesCountById);

  return likesCountById;
}

export const dbCacheKey = "likes" as const;

export async function getLikesCountForThemeId(
  themeId: string,
  session: AstroSharedContext["session"] | undefined,
) {
  return (await getLikeCountsByThemeIds(session))[themeId] || 0;
}
