import type { InferEntrySchema } from "astro:content";
import type { ComponentProps } from "preact";
import type { AuthorsFormatter } from "./components/authorsFormatter";

export type SearchTheme = Pick<
  InferEntrySchema<"themes">,
  "urlBase" | "mainThumbnail" | "name" | "year" | "isNew" | "archiveFile"
> & {
  id: string;
  authors: ComponentProps<typeof AuthorsFormatter>["authors"];
};
