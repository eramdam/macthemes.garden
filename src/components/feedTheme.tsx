import { getEntries, type InferEntrySchema } from "astro:content";
import render from "preact-render-to-string/jsx";
import { AuthorsFormatter } from "./authorsFormatter";

export async function renderFeedTheme(
  theme: InferEntrySchema<"themes">,
  baseUrl: URL,
) {
  const authors = (await getEntries(theme.authors)).map((a) => a.data);
  return render(
    <p>
      {theme.thumbnails.map((thumb) => {
        return (
          <img src={`${baseUrl}${thumb}`} alt={theme.name} class="thumbnail" />
        );
      })}
      <a href={`${baseUrl}themes/${theme.urlBase}`}>{theme.name}</a> by{" "}
      <AuthorsFormatter asLinks authors={authors}></AuthorsFormatter>{" "}
      {theme.year && `released in ${theme.year}`}
    </p>,
    {},
    { pretty: true },
  );
}
