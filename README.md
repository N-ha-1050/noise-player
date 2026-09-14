---
title: Noise Player
author: N_ha
---

オフライン環境でも動作する、Web Audio API を活用した軽量・高性能なノイズプレイヤーです。  
ホワイトノイズ・ピンクノイズ・ブラウンノイズをリアルタイムで合成・生成し、集中やリラックスをサポートします。

---

## 特徴

- **オフライン対応 (PWA)** : プログレッシブウェブアプリ（PWA）に対応。ブラウザからインストールしてオフラインでも再生可能。
- **リアルタイムノイズ生成** : Web Audio API を使用し、オーディオファイルをダウンロードすることなく低遅延・無限ループでノイズを生成。
- **高レスポンス設計** : AudioWorklet / Web Workers を活用し、ノイズ生成処理をメインスレッドから分離。UI の快適な操作性を維持。
- **バックグラウンド再生** : Media Session API に対応し、画面ロック時や別タブでのバックグラウンド再生・メディアキー操作をサポート。

---

## 技術スタック

- **Language**: [TypeScript](https://www.typescriptlang.org/ja/)
- **Package Manager**: [pnpm](https://pnpm.io/ja/)
- **Bundler & Dev Server**: [Vite](https://ja.vite.dev/)
- **Linter & Formatter**: [Biome](https://biomejs.dev/ja/)
- **Git Hooks**: [Lefthook](https://lefthook.dev/)
- **CI / CD & Hosting**: [GitHub Actions](https://docs.github.com/ja/actions), [GitHub Pages](https://docs.github.com/ja/pages)

---

## 開発の始め方

### 前提条件

- pnpm (`package.json` で指定されたバージョン: `12.4.1`)

### 依存関係のインストール

```bash
pnpm install
```

### Git Hooks の有効化

コミット時・プッシュ時の自動フォーマットおよび型チェックを有効化します。

```bash
pnpm lefthook install
```

---

## コマンド一覧

| コマンド | 説明 |
| :--- | :--- |
| `pnpm dev` | 開発用ローカルサーバーを起動します |
| `pnpm build` | 本番用ビルドを実行します (`tsc && vite build`) |
| `pnpm preview` | ビルド成果物をローカルでプレビューします |
| `pnpm typecheck` | TypeScript の型チェックを実行します (`tsc --noEmit`) |
| `pnpm check` | 型チェックと Biome によるコード検証をまとめて実行します |

---

## CI / CD パイプライン

- **Pull Request / Push**:
  - Biome によるコード規約・リント・フォーマット検証
  - TypeScript による型チェックおよびビルド検証
- **Deploy**:
  - `main` ブランチへのプッシュ時に、GitHub Actions 経由で GitHub Pages に自動デプロイされます。
