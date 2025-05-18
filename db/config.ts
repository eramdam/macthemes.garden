import { column, defineDb, defineTable } from "astro:db";

const Like = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    themeId: column.text({
      references() {
        return Theme.columns.id;
      },
    }),
    userId: column.text(),
  },
  indexes: [
    {
      on: ["id"],
      unique: true,
    },
    {
      on: ["themeId", "userId"],
    },
  ],
});

const Theme = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
  },
  indexes: [
    {
      on: ["id"],
      unique: true,
    },
  ],
});

const UserRequest = defineTable({
  columns: {
    userId: column.text(),
    date: column.date(),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: { Like, Theme, UserRequest },
});
