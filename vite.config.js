import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  server: {
    // Accesible desde el celular en la misma red para probar el flujo NFC/QR.
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        // La landing pública y el dashboard interno del equipo.
        main: resolve(__dirname, "index.html"),
        leads: resolve(__dirname, "leads.html"),
      },
    },
    // La página es una sola pantalla: un solo archivo de CSS/JS pesa menos
    // que el overhead de varios chunks.
    assetsInlineLimit: 4096,
  },
});
