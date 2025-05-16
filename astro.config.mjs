import { defineConfig } from "astro/config";
import astroBrokenLinksChecker from "astro-broken-link-checker";

import preact from "@astrojs/preact";

import db from "@astrojs/db";

import netlify from "@astrojs/netlify";

const isDev = import.meta.env.DEV;

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/page/1": "/",
    "/d-desc/1": "/",
    ...(!isDev
      ? {
          "/debug": "/",
        }
      : {}),
  },

  site: isDev ? "http://localhost:4321" : "https://macthemes.garden",

  devToolbar: {
    enabled: false,
  },

  output: "static",

  integrations: [
    astroBrokenLinksChecker({
      logFilePath: "broken-links.log", // Optional: specify the log file path
      checkExternalLinks: false, // Optional: check external links (currently, caching to disk is not supported, and it is slow )
    }),
    preact(),
    db(),
  ],

  adapter: netlify(),
});
