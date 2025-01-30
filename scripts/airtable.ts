import Airtable, { FieldSet, Records } from "airtable";
import fs from "fs-extra";
import async from "async";
import { AssetCache } from "@11ty/eleventy-fetch";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID || "",
);

(async () => {
  const records = await grabRawRecords();
  const normalizedRecords = records.map((record) => {
    return {
      name: record.fields["Name"] as string,
      description: record.fields["Description"] as string,
      authors: record.fields["Author(s)"] as string,
      year: record.fields["Year"] as string,
      about: (record.fields["About"] as Airtable.Attachment[])[0],
      showcase: (record.fields["Showcase"] as Airtable.Attachment[])[0],
      archiveFile: (record.fields["Archive file"] as Airtable.Attachment[])[0],
      ksaSampler: (
        record.fields["KSA Sampler transparent"] as Airtable.Attachment[]
      )[0],
    };
  });
  console.log(`Grabbed ${normalizedRecords.length} records`);

  console.log(`Downloading ${normalizedRecords.length * 4} attachments...`);
  const filePaths = await async.flatMapLimit<
    (typeof normalizedRecords)[0],
    { filepath: string; id: string }
  >(normalizedRecords, 10, async (record: (typeof normalizedRecords)[0]) => {
    const about = await downloadAttachment(record.about, "about-");
    const archiveFile = await downloadAttachment(record.archiveFile);
    const ksaSampler = await downloadAttachment(
      record.ksaSampler,
      "ksa-sampler-",
    );
    const showcase = await downloadAttachment(record.showcase, "showcase-");

    return [about, archiveFile, ksaSampler, showcase];
  });

  const normalizedRecordsWithFilePaths = normalizedRecords.map((record) => {
    return {
      ...record,
      showcase: filePaths.find((f) => f.id === record.showcase.id)?.filepath,
      about: filePaths.find((f) => f.id === record.about.id)?.filepath,
      archiveFile: filePaths.find((f) => f.id === record.archiveFile.id)
        ?.filepath,
      ksaSampler: filePaths.find((f) => f.id === record.ksaSampler.id)
        ?.filepath,
    };
  });
  await fs.writeFile(
    "data/airtable.json",
    JSON.stringify(normalizedRecordsWithFilePaths, null, 2),
    "utf-8",
  );
})();

type Foo = Records<FieldSet>;
async function grabRawRecords(): Promise<Foo> {
  const cache = new AssetCache("garden.macthemes.airtable");

  if (cache.isCacheValid("1d")) {
    return cache.getCachedValue() as Foo;
  }
  const records = await base("Kaleidoscope Schemes")
    .select({
      maxRecords: 5_000,
      view: "Grid view",
    })
    .all();

  await cache.save(records, "json");

  return records;
}

async function downloadAttachment(
  attachment: Airtable.Attachment,
  prefix = "",
) {
  const filename = `${prefix}${attachment.id}-${attachment.filename}`;
  const filepath = `data/attachments/${filename}`;

  if (await fs.exists(filepath)) {
    console.log(`Cache hit for ${filename}`);
    return { id: attachment.id, filepath };
  }

  const response = await fetch(attachment.url);
  const buffer = await response.arrayBuffer();

  console.log(`Downloaded ${filename}`);
  await fs.writeFile(filepath, Buffer.from(buffer));
  return { id: attachment.id, filepath };
}
