import Airtable, { FieldSet, Records } from "airtable";
import async from "async";
import fs from "fs-extra";
import { airtableCache } from "./caches";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID || "",
);

(async () => {
  const records = await grabRawRecords();
  const normalizedRecords = records.map((record) => {
    return {
      name: record.fields["Name"] as string,
      authors: record.fields["Author(s)"] as string,
      year: record.fields["Year"] as string,
      about: (record.fields["About"] as Airtable.Attachment[])?.[0],
      showcase: (record.fields["Showcase"] as Airtable.Attachment[])?.[0],
      archiveFile: (
        record.fields["Archive file"] as Airtable.Attachment[]
      )?.[0],
      ksaSampler: (
        record.fields["KSA Sampler transparent"] as Airtable.Attachment[]
      )?.[0],
    };
  });
  console.log(`Grabbed ${normalizedRecords.length} records`);

  console.log(`Downloading ${normalizedRecords.length * 4} attachments...`);
  const filePaths = await async.flatMapLimit<
    (typeof normalizedRecords)[0],
    { filepath: string; id: string; filename: string }
  >(normalizedRecords, 10, async (record: (typeof normalizedRecords)[0]) => {
    const about = await downloadAttachment(record.about, "about-");
    const ksaSampler = await downloadAttachment(
      record.ksaSampler,
      "ksa-sampler-",
    );
    const showcase = await downloadAttachment(record.showcase, "showcase-");

    return [about, ksaSampler, showcase].filter((f) => !!f);
  });

  const normalizedRecordsWithFilePaths = normalizedRecords
    .map((record) => {
      return {
        ...record,
        showcase: filePaths.find((f) => f.id === record.showcase?.id)?.filepath,
        about: filePaths.find((f) => f.id === record.about?.id)?.filepath,
        archiveFile: undefined,
        archiveFilename: record.archiveFile?.filename.endsWith(".sit")
          ? record.archiveFile?.filename
          : undefined,
        ksaSampler: filePaths.find((f) => f.id === record.ksaSampler?.id)
          ?.filepath,
      };
    })
    .filter((f) => !!f && Object.values(f).filter((v) => !!v).length);

  await fs.writeFile(
    "src/themes/airtable.json",
    JSON.stringify(normalizedRecordsWithFilePaths, null, 2),
    "utf-8",
  );
})();

async function downloadAttachment(
  attachment: Airtable.Attachment | undefined,
  prefix = "",
): Promise<{ id: string; filepath: string; filename: string } | undefined> {
  if (!attachment) {
    return undefined;
  }
  const filename = `${prefix}${attachment.id}-${attachment.filename}`;
  const filepath = `src/themes/attachments/${filename}`;

  if (await fs.exists(filepath)) {
    console.log(`Cache hit for ${filename}`);
    return { id: attachment.id, filepath, filename: attachment.filename };
  }

  const response = await fetch(attachment.url);
  const buffer = await response.arrayBuffer();

  console.log(`Downloaded ${filename}`);
  await fs.writeFile(filepath, Buffer.from(buffer));
  return { id: attachment.id, filepath, filename: attachment.filename };
}

async function grabRawRecords(): Promise<Records<FieldSet>> {
  if (airtableCache.isCacheValid("1d")) {
    return airtableCache.getCachedValue() as unknown as Records<FieldSet>;
  }
  const records = await base("Kaleidoscope Schemes")
    .select({
      maxRecords: 5_000,
      view: "Grid view",
    })
    .all();

  await airtableCache.save(records, "json");

  return records;
}
