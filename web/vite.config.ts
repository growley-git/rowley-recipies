import vue from "@vitejs/plugin-vue";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: process.env.VITE_ELECTRON === "1" ? "./" : "/",
  plugins: [vue()],
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        // Modern Sass API (Dart Sass 2+); silences legacy JS API deprecation in Vite 6
        api: "modern-compiler",
        loadPaths: [path.resolve(root, "src/styles")],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@rowley/domain": path.resolve(root, "../../packages/domain/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
