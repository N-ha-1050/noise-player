import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { preview } from "vite"

const SCREENSHOT_TARGETS: {
  name: string
  viewport: { width: number; height: number }
  colorScheme: "light" | "dark"
  isMobile: boolean
}[] = [
  {
    name: "desktop-light.png",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    isMobile: false,
  },
  {
    name: "desktop-dark.png",
    viewport: { width: 1280, height: 720 },
    colorScheme: "dark",
    isMobile: false,
  },
  {
    name: "mobile-light.png",
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    isMobile: true,
  },
  {
    name: "mobile-dark.png",
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    isMobile: true,
  },
]

async function main() {
  const outDir = path.resolve("public/screenshots")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // ビルド成果物をプレビューサーバー（ポート 4173）で起動
  const server = await preview({ preview: { port: 4173 } })
  const browser = await chromium.launch()

  try {
    for (const target of SCREENSHOT_TARGETS) {
      const context = await browser.newContext({
        viewport: target.viewport,
        colorScheme: target.colorScheme,
        userAgent: target.isMobile
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          : undefined,
      })

      const page = await context.newPage()
      await page.goto("http://localhost:4173")
      await page.waitForLoadState("networkidle")

      const outputPath = path.join(outDir, target.name)
      await page.screenshot({ path: outputPath })
      console.log(`Saved screenshot: ${target.name}`)

      await context.close()
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
