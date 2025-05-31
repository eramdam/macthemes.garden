import { db, Like, LikesCount, Theme } from "astro:db";
import { chunk, shuffle } from "lodash-es";
import { v4 } from "uuid";
import { generateUserUUID } from "../src/helpers/dbHelpers";
import { themesLoader } from "../src/themesLoader";

const USER_IP = "1.1.1.1";
const themes = await themesLoader({ colors: false, relatedThemes: false });
const randomLikes = true;
// https://astro.build/db/seed
export default async function seed() {
  const userId = generateUserUUID(USER_IP);
  let records = 0;
  let themesCount = 0;

  console.time("seed");
  if (randomLikes) {
    for (const themesChunk of chunk(shuffle(themes), 200)) {
      const operations = themesChunk
        .filter((t) => {
          const modulo = parseInt(t.id, 16) % 16;

          return modulo > 5;
        })
        .flatMap((theme, index) => {
          themesCount++;
          const modulo = parseInt(theme.id, 16) % 10;
          const numberOfLikesForTheme = (index % 10) + modulo;
          return [
            db.insert(Theme).values({
              id: theme.id,
            }),
            ...Array.from({ length: numberOfLikesForTheme }).map(() => {
              return db.insert(Like).values({
                themeId: theme.id,
                id: v4(),
                userId,
              });
            }),
            db.insert(LikesCount).values({
              themeId: theme.id,
              count: numberOfLikesForTheme,
            }),
          ];
        });

      records += operations.length;

      // @ts-expect-error
      await db.batch(operations);
    }
  }

  console.timeEnd("seed");
  console.log(`${records} records`);
  console.log(`${themesCount} themes`);
}
