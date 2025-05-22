// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://femitaofeeq.com",
  output: "server",
  integrations: [
    mdx(), 
    tailwind()
    // Removed sitemap() integration since we're using custom dynamic sitemap
  ],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});