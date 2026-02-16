import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://pabloiyu.github.io",
  output: "static",
  devToolbar: { enabled: false },
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
