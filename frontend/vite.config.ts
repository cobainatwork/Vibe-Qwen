import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// BFF 位址：dev 以 proxy 轉發 /api，避免瀏覽器跨來源並對齊嚴格 CORS。
const BFF_TARGET = process.env.VITE_BFF_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: BFF_TARGET, changeOrigin: false },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
