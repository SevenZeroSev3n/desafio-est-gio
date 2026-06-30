import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api -> backend (porta 3001) para evitar CORS no desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
