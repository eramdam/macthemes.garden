import { db, Like } from "astro:db";
import { v4 } from "uuid";
import { generateUserUUID } from "../src/helpers/dbHelpers";

const THEME_ID = `7ff3f73493ff`;
const USER_IP = "1.1.1.1";
// https://astro.build/db/seed
export default async function seed() {
  const userId = generateUserUUID(USER_IP);
  await db.insert(Like).values([
    {
      themeId: THEME_ID,
      id: v4(),
      userId,
    },
    {
      themeId: THEME_ID,
      id: v4(),
      userId,
    },
    {
      themeId: THEME_ID,
      id: v4(),
      userId,
    },
  ]);
}
