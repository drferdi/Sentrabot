import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Marketing site is multi-page (landing + static HTML). Do not SPA-fallback
  // unknown paths to the homepage; Vercel serves public/404.html in production.
  appType: "mpa",
  plugins: [react()],
  server: {
    // PORT lets the editor preview assign a free port; 5173 otherwise.
    port: Number(process.env.PORT) || 5173,
    open: false,
  },
  build: {
    assetsInlineLimit: 0,
  },
});
