import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@passage/shared": path.resolve(__dirname, "../shared"),
    },
  },
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: 120_000,
      },
    },
  },
});
