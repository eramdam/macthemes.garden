import { and, count, db, eq, Like, Theme, UserRequest } from "astro:db";
import { getSecret } from "astro:env/server";
import { chunk, flatten, memoize } from "lodash-es";
import { v5 } from "uuid";

export async function getLikesForTheme(id: string) {
  return db.select().from(Like).where(eq(Like.themeId, id));
}

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

async function _getLikeCountsByThemeIds() {
  const likedThemesIds = (await db.select().from(Theme)).map((t) => t.id);
  let likesCountById: Record<string, number> = {};

  for (const element of chunk(likedThemesIds, 400)) {
    const transactions = element.map((id) => {
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

  return likesCountById;
}

export const getLikeCountsByThemeIds = memoize(_getLikeCountsByThemeIds);
