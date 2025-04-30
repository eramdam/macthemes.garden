import type { InferEntrySchema } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";

const ASPECT_RATIO = 1200 / 630;

export async function generateOpenGraphImageForTheme(
  theme: InferEntrySchema<"themes">,
) {
  let blurredImageData: Buffer | undefined;

  if (theme.thumbnails.length > 1) {
    blurredImageData = await sharp("public/" + theme.thumbnails[1])
      .blur(5)
      .toBuffer();
  }

  const mainThumbnailSharp = sharp("public" + theme.mainThumbnail);
  const mainThumbnail = await mainThumbnailSharp.png().toBuffer();
  const mainThumbnailData = await mainThumbnailSharp.metadata();
  const margin = 20;
  const imageDimension = {
    height: mainThumbnailData.height! + margin,
    width: Math.floor((mainThumbnailData.height! + margin) * ASPECT_RATIO),
  };

  const svg = await satori(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyItems: "center",
        width: imageDimension.width + margin * 2,
        height: imageDimension.height + margin * 2,
        position: "relative",
      }}
    >
      {blurredImageData && (
        <img
          // @ts-expect-error
          src={toArrayBuffer(blurredImageData)}
          style={{
            position: "absolute",
            filter: "brightness(40%)",
            left: 0,
            top: 0,
          }}
        />
      )}
      <img
        // @ts-expect-error
        src={toArrayBuffer(mainThumbnail)}
        height={mainThumbnailData.height}
        width={mainThumbnailData.width}
        style={{
          margin: `${margin / 2}px auto`,
        }}
      />
    </div>,
    {
      width: imageDimension.width + margin * 2,
      height: imageDimension.height + margin * 2,
      fonts: [],
    },
  );

  return sharp(Buffer.from(svg));
}

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}
