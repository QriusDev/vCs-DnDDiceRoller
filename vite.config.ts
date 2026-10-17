import { defineConfig } from "vite";
import path from "node:path";
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
}));
