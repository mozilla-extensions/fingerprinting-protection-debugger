import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "hot-reload-exp-api",
      async buildStart() {
        for (const file of [
          "src/api.mjs",
          "src/manifest.json",
          "src/schema.json",
        ]) {
          this.addWatchFile(file);
        }
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "src/api.mjs",
          dest: "",
        },
        {
          src: "src/manifest.json",
          dest: "",
        },
        {
          src: "src/schema.json",
          dest: "",
        },
        {
          src: "assets/fingerprint.svg",
          dest: "assets",
        },
      ],
    }),
  ],
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      external: ["src/manifest.json"],
    },
  },
  base: "",
});
