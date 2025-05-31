import type { InferEntrySchema } from "astro:content";
import satori from "satori";
import sharp from "sharp";

export async function generateOpenGraphImageForTheme(
  theme: Pick<InferEntrySchema<"themes">, "thumbnails" | "mainThumbnail">,
) {
  let blurredImageData: Buffer | undefined;
  const margin = 20;
  const imageDimension = {
    width: 1200,
    height: 630,
  };

  if (theme.thumbnails.length > 1) {
    blurredImageData = await sharp("public/" + theme.thumbnails[1])
      .resize(imageDimension.width, imageDimension.height, {
        fit: "cover",
        position: "top",
      })
      .blur(5)
      .toBuffer();
  }

  const mainThumbnailSharp = sharp("public" + theme.mainThumbnail);
  const mainThumbnail = await mainThumbnailSharp.png().toBuffer();
  const mainThumbnailData = await sharp(mainThumbnail).metadata();
  if (!mainThumbnailData.hasAlpha) {
    console.log(theme);
  }

  const svg = await satori(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "white",
      }}
    >
      {blurredImageData && (
        <img
          // @ts-expect-error
          src={toArrayBuffer(blurredImageData)}
          style={{
            position: "absolute",
            filter: "brightness(40%)",
            inset: 0,
          }}
        />
      )}
      <img
        // @ts-expect-error
        src={toArrayBuffer(mainThumbnail)}
        style={{
          padding: margin,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          objectFit: "contain",
          objectPosition: "center center",
        }}
      />
    </div>,
    {
      width: imageDimension.width,
      height: imageDimension.height,
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
