import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

import { ensureAudioInitialized, setNoiseType } from "./audio/audioEngine"
import {
  type NoiseType,
  noiseTypes,
  validNoiseType,
} from "./audio/noiseCreators"
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
      anchorAudio: null
    }
  | {
      isPlaying: boolean
      context: AudioContext
      gainNode: GainNode
      noiseNode: AudioWorkletNode
      anchorAudio: HTMLAudioElement
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

function getCurrentNoiseType() {
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement
  const noiseType = validNoiseType(noiseSelect.value)
    ? noiseSelect.value
    : "white"
  return noiseType
}

async function startPlayback(state: State) {
  const volumeInput = document.getElementById(
    "volume-input",
  ) as HTMLInputElement
  const {
    context: stateContext,
    gainNode: stateGainNode,
    noiseNode: stateNoiseNode,
    anchorAudio: stateAnchorAudio,
  } = state

  const { context, gainNode, noiseNode, anchorAudio } =
    await ensureAudioInitialized(
      stateContext,
      stateGainNode,
      stateNoiseNode,
      stateAnchorAudio,
    )

  if (context.state === "suspended") await context.resume()
  await anchorAudio.play().catch(() => {
    // 自動再生ポリシー違反時のフォールバック
  })

  // 再生: 現在選択中のノイズを設定し、スライダーの音量へフェードイン
  const noiseType = getCurrentNoiseType()
  setNoiseType(noiseType, noiseNode)

  const targetVolume = parseFloat(volumeInput.value)
  gainNode.gain.setTargetAtTime(targetVolume, context.currentTime, 0.05)

  updateMediaSession(true, noiseType)

  state = {
    isPlaying: true,
    context,
    gainNode,
    noiseNode,
    anchorAudio,
  }
  render(state)
  return state
}

function stopPlayback(state: State) {
  if (!state.isPlaying) return state

  const { context, gainNode, noiseNode, anchorAudio } = state

  // 停止: ポップノイズ防止のため 0.05秒かけて音量を 0 にフェードアウト
  gainNode.gain.setTargetAtTime(0.001, context.currentTime, 0.05) // メディアコントロールを表示し続けるために 0.001 と設定

  // フェードアウト完了後（約60ms後）に AudioContext を完全休止
  // setTimeout(async () => {
  //   if (!state.isPlaying && context.state === "running") {
  //     await context.suspend()
  //   }
  // }, 60)

  const noiseType = getCurrentNoiseType()
  updateMediaSession(false, noiseType)

  state = {
    isPlaying: false,
    context,
    gainNode,
    noiseNode,
    anchorAudio,
  }
  render(state)
  return state
}

function changeNoiseType(state: State, noiseType: NoiseType) {
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement
  noiseSelect.value = noiseType

  const { noiseNode, isPlaying } = state

  if (noiseNode) {
    // 再生中でも停止中でも、Worklet にメッセージを送るだけで即座に切り替わる
    setNoiseType(noiseType, noiseNode)
  }

  // 再生中であれば、ロック画面等のタイトル表示も即座に更新
  updateMediaSession(isPlaying, noiseType)

  return state
}

function getPreviousNoiseType(current: NoiseType) {
  const currentIndex = noiseTypes.indexOf(current)
  const previousIndex =
    (currentIndex - 1 + noiseTypes.length) % noiseTypes.length
  return noiseTypes[previousIndex]
}

function getNextNoiseType(current: NoiseType) {
  const currentIndex = noiseTypes.indexOf(current)
  const nextIndex = (currentIndex + 1) % noiseTypes.length
  return noiseTypes[nextIndex]
}

const changeNoiseTypeToPrevious = (state: State, currentNoiseType: NoiseType) =>
  changeNoiseType(state, getPreviousNoiseType(currentNoiseType))

const changeNoiseTypeToNext = (state: State, currentNoiseType: NoiseType) =>
  changeNoiseType(state, getNextNoiseType(currentNoiseType))

async function main() {
  const playButton = document.getElementById("play-button") as HTMLButtonElement
  const volumeInput = document.getElementById(
    "volume-input",
  ) as HTMLInputElement
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement
  const previousButton = document.getElementById(
    "previous-button",
  ) as HTMLButtonElement
  const nextButton = document.getElementById("next-button") as HTMLButtonElement

  let state: State = {
    isPlaying: false,
    context: null,
    gainNode: null,
    noiseNode: null,
    anchorAudio: null,
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
    onNext: () => {
      const currentNoiseType = getCurrentNoiseType()
      state = changeNoiseTypeToNext(state, currentNoiseType)
    },
    onPrevious: () => {
      const currentNoiseType = getCurrentNoiseType()
      state = changeNoiseTypeToPrevious(state, currentNoiseType)
    },
  })

  // 前のノイズボタン
  previousButton.addEventListener("click", () => {
    const currentNoiseType = getCurrentNoiseType()
    state = changeNoiseTypeToPrevious(state, currentNoiseType)
  })

  // 次のノイズボタン
  nextButton.addEventListener("click", () => {
    const currentNoiseType = getCurrentNoiseType()
    state = changeNoiseTypeToNext(state, currentNoiseType)
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
    const noiseType = getCurrentNoiseType()
    state = changeNoiseType(state, noiseType)
  })

  render(state)
}

main()
