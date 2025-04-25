import { defineConfig } from "astro/config";

const isDev = import.meta.env.DEV;

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/page/1": "/",
    ...(!isDev
      ? {
          "/debug": "/",
        }
      : {}),
  },
  devToolbar: {
    enabled: false,
  },
});
