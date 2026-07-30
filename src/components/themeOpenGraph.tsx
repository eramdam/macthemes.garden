import type { InferEntrySchema } from "astro:content";
import { render } from "takumi-js";
import { Renderer } from "@takumi-rs/core";
import sharp from "sharp";

const renderer = new Renderer({ cacheMaxBytes: 64 * 1024 * 1024 });

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
    blurredImageData = await sharp("public/" + theme.thumbnails[1]).toBuffer();
  }

  const mainThumbnailSharp = sharp("public" + theme.mainThumbnail);
  const mainThumbnail = await mainThumbnailSharp.toBuffer();
  const mainThumbnailData = await sharp(mainThumbnail).metadata();
  if (!mainThumbnailData.hasAlpha) {
    console.log("No alpha for", theme);
  }

  const png = await render(
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
          src={toDataUri(blurredImageData)}
          style={{
            position: "absolute",
            inset: 0,
            objectPosition: "top",
            objectFit: "cover",
            filter: "blur(5px) brightness(70%)",
          }}
        />
      )}
      <img
        src={toDataUri(mainThumbnail)}
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
      format: "png",
      fonts: [],
      renderer,
    },
  );

  return sharp(Buffer.from(png));
}

function toDataUri(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
