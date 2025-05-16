import type { InferEntrySchema } from "astro:content";
import type { ComponentProps } from "preact";
import { AuthorsFormatter } from "./authorsFormatter";

const isDev =
  import.meta.env.DEV && import.meta.env.PUBLIC_SHOW_DEBUG === "true";

interface SingleThemeProps {
  theme: Pick<
    InferEntrySchema<"themes">,
    "urlBase" | "mainThumbnail" | "name" | "year" | "isNew" | "likes"
  >;
  authors: ComponentProps<typeof AuthorsFormatter>["authors"];
}

export function SingleTheme(props: SingleThemeProps) {
  const { theme, authors } = props;
  return (
    <div class="single-theme">
      <a href={`/themes/${theme.urlBase}`}>
        <img
          loading="lazy"
          decoding="async"
          src={`${theme.mainThumbnail}`}
          alt=""
        />
      </a>
      <a href={`/themes/${theme.urlBase}`}>
        <div class="single-theme-name">{theme.name}</div>
      </a>
      <div class="single-theme-authors">
        <AuthorsFormatter authors={authors} />
      </div>
      <div class="single-theme-year">{theme.year || "-"}</div>
      {theme.likes > 1 && (
        <div class="single-theme-year">
          {theme.likes.toLocaleString("en")} likes
        </div>
      )}
      {isDev && (
        <div>
          Airtable only:
          <input type="checkbox" checked={theme.isNew} />
        </div>
      )}
    </div>
  );
}
