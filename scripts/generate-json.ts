import fs from "node:fs";
import crypto from "node:crypto";

const data: Record<string, { md5: string; size: number }> = {};

for await (const element of fs.promises.glob("*.sit")) {
  data[element] = {
    md5: await md5File(element),
    size: (await fs.promises.stat(element)).size,
  };
}

await fs.promises.writeFile("data.json", JSON.stringify(data), "utf-8");

function md5File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = crypto.createHash("md5");
    const input = fs.createReadStream(path);

    input.on("error", (err) => {
      reject(err);
    });

    output.once("readable", () => {
      resolve(output.read().toString("hex"));
    });

    input.pipe(output);
  });
}
