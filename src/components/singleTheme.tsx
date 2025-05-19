import type { InferEntrySchema } from "astro:content";
import type { ComponentProps } from "preact";
import { AuthorsFormatter } from "./authorsFormatter";

const isDev =
  import.meta.env.DEV && import.meta.env.PUBLIC_SHOW_DEBUG === "true";

interface SingleThemeProps {
  theme: Pick<
    InferEntrySchema<"themes">,
    "urlBase" | "mainThumbnail" | "name" | "year" | "isNew"
  >;
  likes?: number;
  authors: ComponentProps<typeof AuthorsFormatter>["authors"];
}

export function SingleTheme(props: SingleThemeProps) {
  const { theme, authors, likes } = props;
  const yearPart = theme.year && (
    <>
      <img src="/assets/calendar.png" />
      {theme.year}
    </>
  );
  const likesPart = (likes || 0) > 1 && (
    <>
      <img src="/assets/heart.png" />
      {likes}
    </>
  );
  return (
    <div class="single-theme">
      <a href={`/themes/${theme.urlBase}`}>
        <img
          loading="lazy"
          decoding="async"
          class="single-theme-image"
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
      <div className="single-theme-year">
        <span>{yearPart || null}</span>
        <span>{likesPart || null}</span>
      </div>
      {isDev && (
        <div>
          Airtable only:
          <input type="checkbox" checked={theme.isNew} />
        </div>
      )}
    </div>
  );
}
