import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/page/1": "/",
  },
  devToolbar: {
    enabled: false,
  },
});
