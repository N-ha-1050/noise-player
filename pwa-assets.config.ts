import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config"

preset.maskable.resizeOptions = {
  ...preset.maskable.resizeOptions,
  background: "#99E142",
}

export default defineConfig({
  preset,
  images: ["public/favicon.svg"],
})
