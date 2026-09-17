import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Accesible desde el celular en la misma red para probar el flujo NFC/QR.
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    // La página es una sola pantalla: un solo archivo de CSS/JS pesa menos
    // que el overhead de varios chunks.
    assetsInlineLimit: 4096,
  },
});
