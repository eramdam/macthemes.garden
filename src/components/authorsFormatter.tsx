interface AuthorsFormatterProps {
  authors: Array<{ name: string; url: string }>;
  asLinks?: true;
}

const listFormatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

export function AuthorsFormatter(props: AuthorsFormatterProps) {
  const authors = props.authors;
  const authorNames = props.authors.map((a) => a.name);
  return (
    (authors.length &&
      listFormatter.formatToParts(authorNames).map((e) => {
        if (e.type === "element" && props.asLinks) {
          const author = authors.find((a) => a.name === e.value);

          return <a href={author?.url ? author?.url : undefined}>{e.value}</a>;
        }

        return e.value;
      })) || <em>Unknown</em>
  );
}
