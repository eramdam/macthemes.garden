import pluginWebc from "@11ty/eleventy-plugin-webc";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addLiquidFilter("take", function (array, count) {
    return array.slice(0, count);
  });
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("data/attachments", "/data");
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.addPlugin(pluginWebc, {
    components: "./src/_components/**/*.webc",
    useTransform: true,
  });
}
