import { and, db, eq, Like, UserRequest } from "astro:db";
import { getSecret } from "astro:env/server";
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
