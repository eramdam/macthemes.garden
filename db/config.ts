import { column, defineDb, defineTable } from "astro:db";

const Like = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    themeId: column.text(),
    userId: column.text(),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: { Like },
});
