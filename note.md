---
title: Note
---

## 目次

[TOC]

## プロジェクト概要

- オフライン対応ノイズプレイヤー
- PWA に対応し、インストール可能、オフライン再生可能
- Web Audio API を使用して、ホワイトノイズ、ピンクノイズ、ブラウンノイズをリアルタイムで生成
- Web Workers や AudioWorklet を使用して、ノイズ生成をメインスレッドから分離し、UI の応答性を向上
- Media Session API を使用して、バックグラウンド再生やメディアコントロールをサポート

## 技術スタック

- pnpm
- Vite (Vanilla TypeScript)
- Biome
- Lefthook
- GitHub Pages

## プロジェクトの開始

### ディレクトリの作成

```powershell
mkdir noise-player
cd noise-player
git init
```

### pnpm のインストール

<https://pnpm.io/ja/installation>

### Viteプロジェクトの作成

<https://ja.vite.dev/guide/>

```powershell
pnpm create vite .
```

- Select a framework: `Vanilla`
- Select a variant: `TypeScript`
- Install with pnpm and start now?: `Yes`

### lefthook のインストール

<https://lefthook.dev/installation/node/>

```powershell
pnpm add -D lefthook
pnpm approve-builds
```

### Biome のインストールと設定

<https://biomejs.dev/ja/guides/getting-started/>

```powershell
pnpm add -D -E @biomejs/biome
pnpm biome init
```

#### 設定ファイル

<https://biomejs.dev/ja/guides/configure-biome/>

<https://biomejs.dev/ja/reference/configuration/>

[biome.json](./biome.json) を編集

- `formatter.indentStyle` : `space`
- `javascript.formatter.semicolon` : `asNeeded`
- `html.formatter.enabled` : `true`

#### VSCode 拡張機能

<https://biomejs.dev/ja/reference/vscode/>

<https://marketplace.visualstudio.com/items?itemName=biomejs.biome>

[.vscode/settings.json](./.vscode/settings.json) を作成して、以下の内容を記述

```json
{
  "biome.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[css]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[html]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

#### 継続的インテグレーション

<https://biomejs.dev/ja/recipes/continuous-integration/>

[.github/workflows/pull_request.yml](./.github/workflows/pull_request.yml) を作成して、以下の内容を記述

```yaml
name: Code quality

on:
  push:
  pull_request:

jobs:
  biome:
    name: Biome Check
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          persist-credentials: false
      - name: Setup Biome
        uses: biomejs/setup-biome@v2
      - name: Run Biome
        run: biome ci .

  typecheck:
    name: Type Check & Build
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          persist-credentials: false
      - name: Set up pnpm
        uses: pnpm/setup@v2
        with:
          cache: true
      - name: Type check
        run: pnpm typecheck
      - name: Build
        run: pnpm build
```

#### Git Hooks の設定

<https://biomejs.dev/ja/recipes/git-hooks/>

[lefthook.yml](./lefthook.yml) に以下の内容を記述して、 `pnpm lefthook install` を実行

```yaml
pre-commit:
  commands:
    typecheck:
      run: pnpm typecheck
    biome:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,css}"
      run: pnpm biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true
pre-push:
  commands:
    typecheck:
      run: pnpm typecheck
    biome:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,css}"
      run: pnpm biome check --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {push_files}
```

### GitHub Pages へのデプロイ設定

<https://ja.vite.dev/guide/static-deploy#github-pages>

[.github/workflows/deploy.yml](./.github/workflows/deploy.yml) を作成して、以下の内容を記述

```yaml
# Simple workflow for deploying static content to GitHub Pages
name: Deploy static content to Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ['main']

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets the GITHUB_TOKEN permissions to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  # Single deploy job since we're just deploying
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      - name: Set up pnpm
        uses: pnpm/setup@v2
        with:
          cache: true
      - name: Build
        run: pnpm build
      - name: Setup Pages
        uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5
        with:
          # Upload dist folder
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5
```
