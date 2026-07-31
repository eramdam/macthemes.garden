import fs from "fs-extra";
import { chunk } from "es-toolkit";
// import lexicons
import type {} from "@atcute/atproto";
import type {} from "@atcute/bluesky";
import { fromUint8Array } from "@atcute/repo";
import { Client } from "@atcute/client";
import { PasswordSession } from "@atcute/password-session";

const actor = "did:plc:a5j6hkim467cvi4rzouh6aei";
const session = await PasswordSession.login({
  service: "https://bsky.social",
  identifier: process.env.BLUESKY_USERNAME || "",
  password: process.env.BLUESKY_PASSWORD || "",
});
const rpc = new Client({ handler: session });

const { data, ok } = await rpc.get("com.atproto.sync.getRepo", {
  as: "bytes",
  params: {
    did: actor,
  },
});

if (!ok) {
  process.exit(1);
}

const urlRegex = new RegExp("https://macthemes.garden/themes/([a-z0-9]+)", "i");
const records: { rkey: string; themeId: string }[] = [];
// convenient iterator for reading through an AT Protocol CAR repository
for (const { collection, rkey, record } of fromUint8Array(data)) {
  if (collection === "app.bsky.feed.post") {
    if (
      (record as any).facets?.[0].features?.[0].$type ===
      "app.bsky.richtext.facet#link"
    ) {
      if (
        (record as any).facets?.[0].features?.[0].uri.startsWith(
          "https://macthemes.garden/themes/",
        )
      ) {
        const [, themeId] =
          String((record as any).facets?.[0].features?.[0].uri).match(
            urlRegex,
          ) || [];
        if (themeId) {
          records.push({ themeId, rkey });
        }
      }
    }
  }
}

let likesByThemeIds: Record<string, number> = {};

for (const recordsChunk of chunk(records, 25)) {
  const { data, ok } = await rpc.get("app.bsky.feed.getPosts", {
    params: {
      uris: recordsChunk.map((r) => makeUri(r.rkey)),
    },
  });
  if (ok) {
    data.posts.forEach((post) => {
      const themeIdForPost = recordsChunk.find((r) => {
        return makeUri(r.rkey) === post.uri;
      })?.themeId;

      if (themeIdForPost) {
        likesByThemeIds[themeIdForPost] =
          (likesByThemeIds[themeIdForPost] || 0) +
          (post.likeCount || 0) +
          (post.repostCount || 0);
      }
    });
  }
}

await fs.writeFile(
  new URL(import.meta.resolve("../src/themes/likes-bsky.json")).pathname,
  JSON.stringify(
    {
      likes: likesByThemeIds,
    },
    null,
    2,
  ),
  "utf-8",
);

function makeUri(rkey: string): any {
  return `at://${actor}/app.bsky.feed.post/${rkey}`;
}
