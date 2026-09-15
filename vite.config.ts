import type { UserConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default {
  base: "/",
  plugins: [
    VitePWA({
      devOptions: { enabled: true },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      pwaAssets: {
        config: true,
      },
      manifest: {
        name: "Noise Player",
        short_name: "NoisePlayer",
        description: "オフライン対応ノイズプレイヤー",
        theme_color: "#99E142",
        background_color: "#99E142",
        lang: "ja",
        screenshots: [
          {
            src: "screenshots/desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Desktop View",
          },
          {
            src: "screenshots/mobile.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Mobile View",
          },
        ],
      },
    }),
  ],
} satisfies UserConfig
