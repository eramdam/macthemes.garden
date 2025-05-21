import { ActionError, defineAction } from "astro:actions";
import { themesLoader } from "../themesLoader";
import { z } from "astro:content";
import { and, db, eq, Like, Theme } from "astro:db";
import { v4 } from "uuid";
import {
  clearLikesPerIdCache,
  generateUserUUID,
  getLikeForUserIdAndTheme,
  getLikesCountForThemeId,
} from "../helpers/dbHelpers";
import { canUserIdMakeRequest } from "../helpers/rateLimitHelpers";

const themes = await themesLoader();
const possibleIds = new Set(themes.map((t) => t.id));

export const server = {
  toggleLike: defineAction({
    accept: "json",
    input: z.object({
      themeId: z.string().refine(
        (rawString) => {
          return possibleIds.has(rawString);
        },
        {
          message: "String is not a valid theme ID",
        },
      ),
    }),
    handler: async (input, context) => {
      const userId = generateUserUUID(context.clientAddress);
      if (!(await canUserIdMakeRequest(userId))) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Rate-limit exceeded, wait a moment before making another request",
        });
      }

      const existingTheme = await db
        .select()
        .from(Theme)
        .where(eq(Theme.id, input.themeId));

      if (existingTheme.length < 1) {
        await db.insert(Theme).values({
          id: input.themeId,
        });
      }

      const likesForUserAndTheme = await getLikeForUserIdAndTheme(
        userId,
        input.themeId,
      );
      let liked = false;
      if (likesForUserAndTheme.length < 1) {
        await db.insert(Like).values({
          id: v4(),
          themeId: input.themeId,
          userId,
        });
        liked = true;
      } else {
        await db
          .delete(Like)
          .where(and(eq(Like.themeId, input.themeId), eq(Like.userId, userId)));
        liked = false;
      }

      clearLikesPerIdCache();

      const likes = await getLikesCountForThemeId(input.themeId);

      return { liked, likes: likes };
    },
  }),
};
