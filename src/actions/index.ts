import { ActionError, defineAction } from "astro:actions";
import { themesLoader } from "../themesLoader";
import { z } from "astro:content";
import { and, db, eq, Like, Theme } from "astro:db";
import { v4 } from "uuid";
import {
  generateUserUUID,
  getLikeForUserIdAndTheme,
  getLikesForTheme,
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

      const wasThemeAlreadyLiked =
        (
          await db
            .select()
            .from(Like)
            .where(eq(Like.themeId, input.themeId))
            .limit(1)
        ).length > 0;

      if (!wasThemeAlreadyLiked) {
        await db.insert(Theme).values({
          id: input.themeId,
        });
      }

      const likesForUserAndTheme = await getLikeForUserIdAndTheme(
        userId,
        input.themeId,
      );
      if (likesForUserAndTheme.length < 1) {
        await db.insert(Like).values({
          id: v4(),
          themeId: input.themeId,
          userId,
        });
      } else {
        await db
          .delete(Like)
          .where(and(eq(Like.themeId, input.themeId), eq(Like.userId, userId)));
      }

      const likes = await getLikesForTheme(input.themeId);

      return likes.length;
    },
  }),
};
