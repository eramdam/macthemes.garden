import Airtable from "airtable";
import fs from "fs-extra";
import { request } from "undici";
import { Readable } from "node:stream";
import slug from "slug";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID,
);

(async () => {
  const records = await base("Kaleidoscope Schemes")
    .select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 30,
      view: "Grid view",
    })
    .all();
  const normalizedRecords = records.map((record) => {
    return {
      name: record.get("Name") as string,
      description: record.get("Description") as string,
      authors: record.get("Author(s)") as string,
      year: record.get("Year") as string,
      about: (record.get("About") as Airtable.Attachment[])[0],
      showcase: (record.get("Showcase") as Airtable.Attachment[])[0],
      archiveFile: (record.get("Archive file") as Airtable.Attachment[])[0],
      ksaSampler: (
        record.get("KSA Sampler transparent") as Airtable.Attachment[]
      )[0],
    };
  });
  const imagePromises = normalizedRecords.flatMap((record) => {
    return [
      downloadAttachment(record.about, "about-"),
      downloadAttachment(record.archiveFile),
      downloadAttachment(record.ksaSampler, "ksa-sampler-"),
      downloadAttachment(record.showcase, "showcase-"),
    ];
  });

  await Promise.all(imagePromises);
})();

async function downloadAttachment(
  attachment: Airtable.Attachment,
  prefix = "",
) {
  const response = await request(attachment.url);
  const buffer = await response.body.arrayBuffer();
  const filename = `${prefix}${attachment.id}-${attachment.filename}`;
  const filepath = `data/${slug(filename, {
    mode: "rfc3986",
  })}`;

  if (await fs.exists(filepath)) {
    return filepath;
  }

  await fs.writeFile(filepath, Buffer.from(buffer));
  return filepath;
}
