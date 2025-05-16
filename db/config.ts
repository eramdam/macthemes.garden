import { column, defineDb, defineTable } from "astro:db";

const Like = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    themeId: column.text(),
    userId: column.text(),
  },
});

const UserRequest = defineTable({
  columns: {
    userId: column.text(),
    date: column.date(),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: { Like, UserRequest },
});
