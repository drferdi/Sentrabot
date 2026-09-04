import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function customNotFoundPage() {
  const html = readFileSync(resolve("public/404.html"), "utf8");
  const send = (_req, res) => {
    if (res.writableEnded) {
      return;
    }
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  };
  return {
    name: "sentra-site-404",
    configureServer(server) {
      return () => {
        server.middlewares.use(send);
      };
    },
    configurePreviewServer(server) {
      return () => {
        server.middlewares.use(send);
      };
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [react(), customNotFoundPage()],
  server: {
    // PORT lets the editor preview assign a free port; 5173 otherwise.
    port: Number(process.env.PORT) || 5173,
    open: false,
  },
  build: {
    assetsInlineLimit: 0,
  },
});
