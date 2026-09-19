import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

import { ensureAudioInitialized, setNoiseType } from "./audio/audioEngine"
import { validNoiseType } from "./audio/noiseCreators"
import {
  setupMediaSessionHandlers,
  updateMediaSession,
} from "./media/mediaSession"

type State =
  | {
      isPlaying: false
      context: null
      gainNode: null
      noiseNode: null
      silentAudio: null
    }
  | {
      isPlaying: boolean
      context: AudioContext
      gainNode: GainNode
      noiseNode: AudioWorkletNode
      silentAudio: HTMLAudioElement | null
    }

function render(state: State) {
  const playButton = document.getElementById("play-button") as HTMLButtonElement
  const playButtonIcon = document.getElementById(
    "play-button-icon",
  ) as HTMLSpanElement
  const playButtonLabel = document.getElementById(
    "play-button-label",
  ) as HTMLSpanElement

  playButton.setAttribute("aria-pressed", state.isPlaying.toString())
  playButtonIcon.textContent = state.isPlaying ? "pause" : "play_arrow"
  playButtonLabel.textContent = state.isPlaying ? "Pause" : "Play"
}

async function startPlayback(state: State) {
  const volumeInput = document.getElementById(
    "volume-input",
  ) as HTMLInputElement
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement
  const {
    context: stateContext,
    gainNode: stateGainNode,
    noiseNode: stateNoiseNode,
    silentAudio: stateSilentAudio,
  } = state

  const { context, gainNode, noiseNode } = await ensureAudioInitialized(
    stateContext,
    stateGainNode,
    stateNoiseNode,
  )

  if (context.state === "suspended") await context.resume()

  // 再生: 現在選択中のノイズを設定し、スライダーの音量へフェードイン
  const noiseType = validNoiseType(noiseSelect.value)
    ? noiseSelect.value
    : "white"
  setNoiseType(noiseType, noiseNode)

  const targetVolume = parseFloat(volumeInput.value)
  gainNode.gain.setTargetAtTime(targetVolume, context.currentTime, 0.05)

  const silentAudio = updateMediaSession(true, noiseType, stateSilentAudio)

  state = { isPlaying: true, context, gainNode, noiseNode, silentAudio }
  render(state)
  return state
}

function stopPlayback(state: State) {
  if (!state.isPlaying) return state

  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement

  const { context, gainNode, noiseNode } = state

  // 停止: ポップノイズ防止のため 0.05秒かけて音量を 0 にフェードアウト
  gainNode.gain.setTargetAtTime(0, context.currentTime, 0.05)

  // フェードアウト完了後（約60ms後）に AudioContext を完全休止
  setTimeout(async () => {
    if (!state.isPlaying && context.state === "running") {
      await context.suspend()
    }
  }, 60)

  const noiseType = validNoiseType(noiseSelect.value)
    ? noiseSelect.value
    : "white"
  const silentAudio = updateMediaSession(false, noiseType, state.silentAudio)

  state = { isPlaying: false, context, gainNode, noiseNode, silentAudio }
  render(state)
  return state
}

async function main() {
  const playButton = document.getElementById("play-button") as HTMLButtonElement
  const volumeInput = document.getElementById(
    "volume-input",
  ) as HTMLInputElement
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement

  let state: State = {
    isPlaying: false,
    context: null,
    gainNode: null,
    noiseNode: null,
    silentAudio: null,
  }

  // 再生 / 停止ボタン
  playButton.addEventListener("click", async () => {
    if (state.isPlaying) {
      state = stopPlayback(state)
    } else {
      state = await startPlayback(state)
    }
  })

  setupMediaSessionHandlers({
    onPlay: async () => {
      state = await startPlayback(state)
    },
    onPause: () => {
      state = stopPlayback(state)
    },
  })

  // 音量スライダー
  volumeInput.addEventListener("input", () => {
    const { context, gainNode, isPlaying } = state

    if (!gainNode || !context || !isPlaying) return
    const targetVolume = parseFloat(volumeInput.value)
    // スライダー操作時も滑らかに追従
    gainNode.gain.setTargetAtTime(targetVolume, context.currentTime, 0.01)
  })

  // ノイズ種類セレクトボックス
  noiseSelect.addEventListener("change", () => {
    const { noiseNode, isPlaying, silentAudio } = state

    const noiseType = validNoiseType(noiseSelect.value)
      ? noiseSelect.value
      : "white"

    if (noiseNode) {
      // 再生中でも停止中でも、Worklet にメッセージを送るだけで即座に切り替わる
      setNoiseType(noiseType, noiseNode)
    }

    if (isPlaying) {
      // 再生中であれば、ロック画面等のタイトル表示も即座に更新
      updateMediaSession(true, noiseType, silentAudio)
    }
  })

  render(state)
}

main()
