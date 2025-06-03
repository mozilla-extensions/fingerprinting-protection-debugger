import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "hot-reload-exp-api",
      async buildStart() {
        for (const file of [
          "public/api.mjs",
          "public/manifest.json",
          "public/schema.json",
        ]) {
          this.addWatchFile(file);
        }
      },
    },
  ],
  build: {
    outDir: "build",
    sourcemap: true,
  },
  base: "",
});
