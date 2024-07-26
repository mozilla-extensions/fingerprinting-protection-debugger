import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
