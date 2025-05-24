import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:content";
import { db, eq, Theme } from "astro:db";
import {
  addLikeForThemeFromUserId,
  generateUserUUID,
  getLikesCountForThemeId,
  getUserLikeStatusForTheme,
  removelikeForThemeFromUserId,
} from "../helpers/dbHelpers";
import { canUserIdMakeRequest } from "../helpers/rateLimitHelpers";
import { themesLoader } from "../themesLoader";

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

      const didUserLikeThisTheme = await getUserLikeStatusForTheme(
        userId,
        input.themeId,
      );

      let liked = false;
      if (!didUserLikeThisTheme) {
        await addLikeForThemeFromUserId(userId, input.themeId);

        liked = true;
      } else {
        await removelikeForThemeFromUserId(userId, input.themeId);
        liked = false;
      }

      const likes = await getLikesCountForThemeId(input.themeId);

      return { liked, likes: likes };
    },
  }),
};
