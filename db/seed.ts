import { db, Like, Theme } from "astro:db";
import { v4 } from "uuid";
import { generateUserUUID } from "../src/helpers/dbHelpers";
import { themesLoader } from "../src/themesLoader";
import { chunk, random, sample, shuffle } from "lodash-es";

const USER_IP = "1.1.1.1";
const themes = await themesLoader();
const likesNumber = [1, 20, 40, 0, 70, 0, 120, 200];
// https://astro.build/db/seed
export default async function seed() {
  const userId = generateUserUUID(USER_IP);
  let records = 0;
  let themesCount = 0;

  console.time("seed");
  for (const themesChunk of chunk(shuffle(themes), 200)) {
    const numberOfLikesToAdd = sample(likesNumber)! + (Date.now() % 20);
    const operations = themesChunk
      .filter((t) => {
        const shouldAddTheme = Math.random() > 0.3;

        return shouldAddTheme;
      })
      .flatMap((theme) => {
        themesCount++;
        return [
          db.insert(Theme).values({
            id: theme.id,
          }),
          ...Array.from({ length: numberOfLikesToAdd }).map(() => {
            return db.insert(Like).values({
              themeId: theme.id,
              id: v4(),
              userId,
            });
          }),
        ];
      });

    records += operations.length;

    // @ts-expect-error
    await db.batch(operations);
  }
  console.timeEnd("seed");
  console.log(`${records} records`);
  console.log(`${themesCount} themes`);
}
