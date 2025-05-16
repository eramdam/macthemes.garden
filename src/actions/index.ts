import { defineAction } from "astro:actions";
import { themesLoader } from "../themesLoader";
import { z } from "astro:content";
import { and, db, eq, Like } from "astro:db";
import { v4 } from "uuid";
import {
  generateUserUUID,
  getLikeForUserIdAndTheme,
  getLikesForTheme,
} from "../helpers/dbHelpers";

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
