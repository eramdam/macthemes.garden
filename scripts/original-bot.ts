import async from "async";
import fs from "fs-extra";
import path from "node:path";
import sharp from "sharp";

(async () => {
  const kaleidoscopeCollection = await fetch(
    "https://raw.githubusercontent.com/eramdam/shapeshifter-themes/refs/heads/master/data/kaleidoscope.json",
  );
  const json = await kaleidoscopeCollection.json();
  const normalizedRecords: {
    name: string;
    authors: string;
    archiveFilename: string;
    thumbnails: string[];
  }[] = json.map((record) => {
    return {
      name: record.name,
      authors: record.author,
      archiveFilename: path.parse(record.download).base,
      thumbnails: record.thumbnails.map((t) => {
        return `https://raw.githubusercontent.com/eramdam/shapeshifter-themes/refs/heads/master/${String(t).replace(".upscaled", "")}`;
      }),
    };
  });
  const normalizedRecordsWithFilePaths = await async.flatMapLimit(
    normalizedRecords,
    10,
    async (record) => {
      const filepath = await downloadThumbnail(record.thumbnails[0]);

      return {
        ...record,
        thumbnails: [filepath],
      };
    },
  );

  await fs.writeFile(
    "./src/themes/original.json",
    JSON.stringify(normalizedRecordsWithFilePaths, null, 2),
  );
})();

async function downloadThumbnail(thumbnailUrl: string) {
  const thumbnail = path.basename(thumbnailUrl);
  const filepath = `public/themes/attachments/${thumbnail}`;

  if (await fs.exists(filepath)) {
    console.log(`Cache hit for ${thumbnail}`);
    return filepath;
  }

  const res = await fetch(thumbnailUrl);
  let buffer = await res.arrayBuffer();
  const imagedata = await sharp(buffer).metadata();
  buffer = await sharp(buffer)
    .resize({
      width: imagedata!.width! * 4,
      height: imagedata!.height! * 4,
      kernel: "nearest",
    })
    .toBuffer();
  console.log(`Downloaded ${thumbnail}`);
  await fs.writeFile(filepath, Buffer.from(buffer));

  return filepath;
}
