import type { InferEntrySchema } from "astro:content";
import type { ComponentProps } from "preact";
import type { AuthorsFormatter } from "./components/authorsFormatter";

export type SearchTheme = Pick<
  InferEntrySchema<"themes">,
  "urlBase" | "mainThumbnail" | "name" | "year" | "isNew"
> & {
  authors: ComponentProps<typeof AuthorsFormatter>["authors"];
};

export function compressThemes(themes: SearchTheme[]) {
  return themes.map((t) => {
    return {
      u: t.urlBase,
      m: t.mainThumbnail.replace("/themes/attachments/", ""),
      n: t.name,
      y: t.year,
      i: t.isNew,
      a: t.authors.map((a) => {
        return {
          n: a.name,
          u: a.url.replace("/authors/", ""),
        };
      }),
    };
  });
}

export function decompressThemes(themes: ReturnType<typeof compressThemes>) {
  return themes.map((t) => {
    return {
      urlBase: t.u,
      mainThumbnail: `/themes/attachments/${t.m}`,
      name: t.n,
      year: t.y,
      isNew: t.i,
      authors: t.a.map((a) => {
        return {
          name: a.n,
          url: `/authors/${a.u}`,
        };
      }),
    };
  });
}
