export type MediaSessionActionHandlers = [
  MediaSessionAction,
  MediaSessionActionHandler | null,
][]

export function setupMediaSession(handlers: MediaSessionActionHandlers) {
  if ("mediaSession" in navigator) {
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        console.warn(`The media session action "${action}" is not supported.`)
      }
    }
  }
}

export function setMediaPlaybackState(state: MediaSessionPlaybackState) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = state
  }
}

export function setMediaMetadata(title: string) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Noise Player",
      artwork: [
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
      ],
    })
  }
}

export function disableSeekBar() {
  if ("setPositionState" in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Infinity, // 再生時間を「無限大（ライブ）」として上書き通知する
        playbackRate: 1,
        position: 0,
      })
    } catch {
      console.warn(
        "The media session position state is not supported in this browser.",
      )
    }
  }
}
