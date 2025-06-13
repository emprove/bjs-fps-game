import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    server: {
      hmr: false,
    },
    build: {
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 10000000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("@babylonjs")) return "babylon";
            if (id.includes("draco_decoder")) return "draco";
          },
        },
      },
    },
    plugins: [
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: env.VITE_PWA_NAME,
          short_name: env.VITE_PWA_SHORT_NAME,
          start_url: "/",
          display: "fullscreen",
          theme_color: "#000000",
          background_color: "#000000",
          icons: [
            { src: env.VITE_PWA_ICON_192, sizes: "192x192", type: "image/png" },
            { src: env.VITE_PWA_ICON_512, sizes: "512x512", type: "image/png" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,wasm,gltf,glb,png,jpg,webp,mp3}"], // precache
          maximumFileSizeToCacheInBytes: 10000000,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
      }),
    ],
  });
};
