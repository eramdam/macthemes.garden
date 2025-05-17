import { db, Like } from "astro:db";
import { v4 } from "uuid";
import { generateUserUUID } from "../src/helpers/dbHelpers";
import { themesLoader } from "../src/themesLoader";
import { chunk, random, sample } from "lodash-es";

const USER_IP = "1.1.1.1";
const themes = await themesLoader();
const likesNumber = [1, 20, 40, 60];
// https://astro.build/db/seed
export default async function seed() {
  const userId = generateUserUUID(USER_IP);
  let records = 0;

  console.time("seed");
  for (const themesChunk of chunk(themes, 200)) {
    const numberOfLikesToAdd = sample(likesNumber)! + (Date.now() % 20);
    const operations = themesChunk.flatMap((theme) => {
      return Array.from({ length: numberOfLikesToAdd }).map(() => {
        return db.insert(Like).values({
          themeId: theme.id,
          id: v4(),
          userId,
        });
      });
    });

    records += operations.length;

    // @ts-expect-error
    await db.batch(operations);
  }
  console.timeEnd("seed");
  console.log(`${records} records`);
}
