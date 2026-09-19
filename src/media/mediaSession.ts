import type { NoiseType } from "./../audio/noiseCreators"

// 1秒の無音 WAV の Base64 文字列（外部ファイル不要で軽量）
const SILENT_WAV_BASE64 =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"

// ノイズの種類に応じた表示名
const NOISE_TITLES: Record<NoiseType, string> = {
  white: "White Noise",
  pink: "Pink Noise",
  brown: "Brown Noise",
}

const setHandler = (
  action: MediaSessionAction,
  handler: MediaSessionActionHandler,
) => {
  if (!("mediaSession" in navigator)) return
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {}
}

/**
 * OS / ロック画面 / イヤホンボタンからの操作を受け取るハンドラを設定します。
 */
export function setupMediaSessionHandlers(callbacks: {
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
}) {
  if (!("mediaSession" in navigator)) return

  // ロック画面やイヤホンで Play が押された時
  setHandler("play", () => {
    callbacks.onPlay()
  })

  // ロック画面やイヤホンで Pause が押された時
  setHandler("pause", () => {
    callbacks.onPause()
  })

  // Stop アクションも Pause と同様に扱う
  setHandler("stop", () => {
    callbacks.onPause()
  })

  // ロック画面やイヤホンで Next が押された時
  setHandler("nexttrack", () => {
    callbacks.onNext()
  })

  // ロック画面やイヤホンで Previous が押された時
  setHandler("previoustrack", () => {
    callbacks.onPrevious()
  })
}

/**
 * 再生状態・メタデータ（タイトルやアートワーク）を更新し、
 * バックグラウンド維持用の無音オーディオを制御します。
 */
export function updateMediaSession(
  isPlaying: boolean,
  noiseType: NoiseType,
  silentAudio: HTMLAudioElement | null,
) {
  if (!("mediaSession" in navigator)) return null

  if (!silentAudio) {
    silentAudio = new Audio(SILENT_WAV_BASE64)
    silentAudio.loop = true
  }

  // OS 側の再生状態を通知（'playing' | 'paused'）
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"

  if (isPlaying) {
    // バックグラウンド維持: 無音オーディオを再生開始
    silentAudio.play().catch(() => {
      // ユーザー操作前など自動再生ポリシー制限によるエラーを無視
    })

    // ロック画面や通知欄に表示するメタデータを設定
    navigator.mediaSession.metadata = new MediaMetadata({
      title: NOISE_TITLES[noiseType] ?? "Noise Player",
      artist: "Noise Player",
      artwork: [
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
      ],
    })
  } else {
    // 停止時は無音オーディオを一時停止
    silentAudio.pause()
  }

  return silentAudio
}
