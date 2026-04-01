import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy all /gateway/* calls to Ocelot in development
    // This avoids CORS issues during local development
    proxy: {
      "/gateway": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false, // allow self-signed dev certs
      },
    },
  },
});