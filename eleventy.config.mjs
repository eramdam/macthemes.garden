import crypto from "node:crypto";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addLiquidFilter("take", function (array, count) {
    return array.slice(0, count);
  });
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/themes");
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addFilter("number_locale", (number) => {
    return Number(number).toLocaleString("en-US");
  });

  eleventyConfig.setServerOptions({
    domDiff: false,
  });

  eleventyConfig.addPairedShortcode(
    "os9Window",
    (content, title, className = "") => {
      const uid = crypto
        .createHash("sha256")
        .update(Date.now().toString())
        .digest("hex")
        .slice(0, 10);
      return `
    <div class="macos9-window ${className}" id=${uid}>
      <div class="macos9-window-titlebar">
        <button class="button close" data-action="close"></button>
        <span class="filler"></span>
        <span class="title-text">${title}</span>
        <span class="filler"></span>
        <button class="button zoom" data-action="zoom"></button>
        <button class="button collapse" data-action="collapse"></button>
      </div>
      <div class="macos9-window-body">
      ${content}        
      </div>
    </div>
    `;
    },
  );
}
