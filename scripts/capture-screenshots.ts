import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"
import { preview } from "vite"

async function main() {
  const outDir = path.resolve("public/screenshots")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // ビルド成果物をプレビューサーバー（ポート 4173）で起動
  const server = await preview({ preview: { port: 4173 } })
  const browser = await chromium.launch()

  try {
    // デスクトップ用画面の撮影
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })
    const desktopPage = await desktopContext.newPage()
    await desktopPage.goto("http://localhost:4173")
    await desktopPage.waitForLoadState("networkidle")
    await desktopPage.screenshot({ path: path.join(outDir, "desktop.png") })
    await desktopContext.close()

    // モバイル用画面の撮影
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    })
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto("http://localhost:4173")
    await mobilePage.waitForLoadState("networkidle")
    await mobilePage.screenshot({ path: path.join(outDir, "mobile.png") })
    await mobileContext.close()

    console.log("Screenshots generated in public/screenshots/")
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
