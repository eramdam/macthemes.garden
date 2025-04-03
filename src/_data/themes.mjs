import themesKaleidoscopeBot from "../themes/original.json" with { type: "json" };
import themesKaleidoscopeAirtable from "../themes/airtable.json" with { type: "json" };

export function classic() {
  const botThemesNotOnAirtableYet = themesKaleidoscopeBot.filter((theme) => {
    return themesKaleidoscopeAirtable.every((themeAirtable) => {
      return themeAirtable.archiveFileBasename !== theme.archileFilename;
    });
  });

  return themesKaleidoscopeAirtable.map((theme) => {
    return {
      name: theme.name,
      authors: theme.authors,
      year: theme.year,
      thumbnails: [theme.about, theme.showcase, theme.ksaSampler],
      mainThumbnail: theme.ksaSampler,
      archiveFile: theme.archiveFileBasename,
    };
  });
  // .concat(
  //   botThemesNotOnAirtableYet.map((theme) => {
  //     return {
  //       name: theme.name,
  //       year: undefined,
  //       authors: theme.authors,
  //       archiveFile: theme.archileFilename,
  //       thumbnails: theme.thumbnails,
  //       mainThumbnail: theme.thumbnails[0],
  //     };
  //   }),
  // )
  // .sort((a, b) => a.archiveFile.localeCompare(b))
}
