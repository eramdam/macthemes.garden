import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

const isDev = import.meta.env.DEV;

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/page/1": "/",
    "/d-desc/1": "/",
    ...(!isDev
      ? {
          "/debug": "/",
          "/palettes": "/",
        }
      : {}),
  },

  prefetch: {
    defaultStrategy: "hover",
  },

  site: isDev ? "http://localhost:4321" : "https://macthemes.garden",

  devToolbar: {
    enabled: false,
  },

  output: "static",
  integrations: [
    preact(),
    // astroBrokenLinksChecker({
    //   logFilePath: "broken-links.log", // Optional: specify the log file path
    //   checkExternalLinks: false, // Optional: check external links (currently, caching to disk is not supported, and it is slow )
    // }),
  ],
});
