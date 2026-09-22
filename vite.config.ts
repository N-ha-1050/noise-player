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
            src: "screenshots/desktop-light.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Desktop Light View",
          },
          {
            src: "screenshots/desktop-dark.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Desktop Dark View",
          },
          {
            src: "screenshots/mobile-light.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Mobile Light View",
          },
          {
            src: "screenshots/mobile-dark.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Mobile Dark View",
          },
        ],
      },
    }),
  ],
} satisfies UserConfig
