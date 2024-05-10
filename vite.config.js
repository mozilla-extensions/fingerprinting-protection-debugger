import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "i18n-hot-reload",
      async buildStart(){
        for(let file of ["public/api.mjs"]){
            this.addWatchFile(file);
        }
      }
    },
  ],
  build: {
    outDir: "build",
    sourcemap: true,
  },
  base: "",
});
