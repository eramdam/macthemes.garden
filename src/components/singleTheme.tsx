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
      <img class="single-theme-icon" src="/assets/calendar-bw.png" />
      {theme.year}
    </>
  );
  const likesPart = (likes || 0) > 0 && (
    <>
      <img class="single-theme-icon" src="/assets/finder-smile.png" />
      {likes} {(likes || 0) > 1 ? "likes" : "like"}
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
        <img class="single-theme-icon" src="/assets/author.png" />
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
