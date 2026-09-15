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
      },
    }),
  ],
} satisfies UserConfig
