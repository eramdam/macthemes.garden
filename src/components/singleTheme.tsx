import type { InferEntrySchema } from "astro:content";
import type { ComponentProps } from "preact";
import { AuthorsFormatter } from "./authorsFormatter";

const isDev =
  import.meta.env.DEV && import.meta.env.PUBLIC_SHOW_DEBUG === "true";

interface SingleThemeProps {
  theme: Pick<
    InferEntrySchema<"themes">,
    "urlBase" | "mainThumbnail" | "name" | "year" | "isNew" | "createdAt"
  >;
  authors: ComponentProps<typeof AuthorsFormatter>["authors"];
}

export function SingleTheme(props: SingleThemeProps) {
  const { theme, authors } = props;
  return (
    <a href={`/themes/${theme.urlBase}`} class="single-theme">
      <img
        loading="lazy"
        decoding="async"
        src={`${theme.mainThumbnail}`}
        alt=""
      />
      <div class="single-theme-name">{theme.name}</div>
      <div class="single-theme-authors">
        <AuthorsFormatter authors={authors} />
      </div>
      <div class="single-theme-year">{theme.year || "-"}</div>
      {isDev && (
        <>
          <div>{theme.createdAt.toDateString()}</div>
          <div>
            Airtable only:
            <input type="checkbox" checked={theme.isNew} />
          </div>
        </>
      )}
    </a>
  );
}
