import { defineConfig } from "astro/config";
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

  prefetch: {
    defaultStrategy: "hover",
  },

  site: isDev ? "http://localhost:4321" : "https://macthemes.garden",

  devToolbar: {
    enabled: false,
  },

  output: "static",

  integrations: [preact(), db()],

  adapter: netlify(),
});
