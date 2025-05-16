import { db, Like } from "astro:db";
import { v4 } from "uuid";
import { generateUserUUID } from "../src/helpers/dbHelpers";
import { themesLoader } from "../src/themesLoader";
import { random } from "lodash-es";

const THEME_ID = `7ff3f73493ff`;
const USER_IP = "1.1.1.1";
const themes = await themesLoader();
// https://astro.build/db/seed
export default async function seed() {
  const userId = generateUserUUID(USER_IP);

  for (const theme of themes) {
    const numberOfLikesToAdd = random(1, 2);

    await db.insert(Like).values(
      Array.from({ length: numberOfLikesToAdd }).map(() => {
        return {
          themeId: theme.id,
          id: v4(),
          userId,
        };
      }),
    );
  }
}
