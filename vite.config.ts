/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions } from "vite";

// Glazy's API sends no CORS headers, so the browser calls /glazy-api on our
// own origin and the server relays it. Production hosting needs the same
// rewrite: /glazy-api/* → https://api.glazy.org/*
const glazyProxy: Record<string, ProxyOptions> = {
  "/glazy-api": {
    target: "https://api.glazy.org",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/glazy-api/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: glazyProxy },
  preview: { proxy: glazyProxy },
  test: { include: ["src/**/*.test.ts"] },
});
