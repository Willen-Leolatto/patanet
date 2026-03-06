import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path"; // ✅ importa path (ESM)
import { fileURLToPath } from "node:url"; // ✅ para calcular __dirname em ESM

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // ✅ __dirname

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true, type: "module" },
      includeAssets: [
        "favicon.png",
        "robots.txt",
        "offline.html",
        "apple-icon-180.png",
        "apple-splash-*.jpg",
      ],
      manifest: {
        name: "PataNet",
        short_name: "PataNet",
        description: "Rede social e carteira de vacinação de pets.",

        // iOS Safari pode dar refresh em rotas internas (ex: /feed) e, se a navegação for abortada,
        // o Workbox pode cair no fallback. Start URL mais simples ajuda a evitar falsos negativos.
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        lang: "pt-BR",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/pwa-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // FIX: no iPhone (Safari/PWA), o pull-to-refresh pode abortar a navegação momentaneamente.
        // Com navigateFallback=/offline.html isso vira “Você está offline” mesmo com 4G.
        // Ao usar /index.html, o app abre normalmente e o UI do app é quem decide exibir offline.
        navigateFallback: "/index.html",

        // evita que o SW tente responder rotas de API como navegação
        navigateFallbackDenylist: [/^\/api\//, /\/auth\b/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin.includes("fonts.googleapis.com") ||
              url.origin.includes("fonts.gstatic.com"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@features": path.resolve(__dirname, "src/features"),
      "@components": path.resolve(__dirname, "src/components"),
      "@layouts": path.resolve(__dirname, "src/layouts"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  base: "./",
});
