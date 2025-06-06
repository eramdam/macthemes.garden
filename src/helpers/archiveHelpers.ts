import archivesData from "../themes/archive-data.json" with { type: "json" };

const archives = Object.keys(archivesData);
const formatter = Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "kilobyte",
  unitDisplay: "short",
  maximumFractionDigits: 1,
});

export function archiveFileSize(value: string) {
  try {
    const matchingArchive = archives.find((a) => a === value);

    if (!matchingArchive) {
      return "";
    }

    // @ts-expect-error
    const size = archivesData[matchingArchive].size;
    const sizeKilobytes = size / 1024;

    return `(${formatter.format(sizeKilobytes)})`;
  } catch (e) {
    console.error(e);
    return "";
  }
}

export function archiveMd5(value: string) {
  try {
    const matchingArchive = archives.find((a) => a === value);

    if (!matchingArchive) {
      return "";
    }

    // @ts-expect-error
    return archivesData[matchingArchive].md5;
  } catch (e) {
    console.error(e);
    return "";
  }
}
