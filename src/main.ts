import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

import { ensureAudioInitialized, setNoiseType } from "./audio/audioEngine"
import { validNoiseType } from "./audio/noiseCreators"

type State =
  | {
      isPlaying: false
      context: null
      gainNode: null
      noiseNode: null
    }
  | {
      isPlaying: boolean
      context: AudioContext
      gainNode: GainNode
      noiseNode: AudioWorkletNode
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
  playButtonIcon.textContent = state.isPlaying ? "stop" : "play_arrow"
  playButtonLabel.textContent = state.isPlaying ? "Stop" : "Play"
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
  }

  // 再生 / 停止ボタン
  playButton.addEventListener("click", async () => {
    const {
      context: stateContext,
      gainNode: stateGainNode,
      noiseNode: stateNoiseNode,
      isPlaying,
    } = state

    const { context, gainNode, noiseNode } = await ensureAudioInitialized(
      stateContext,
      stateGainNode,
      stateNoiseNode,
    )

    if (isPlaying) {
      // 停止: ポップノイズ防止のため 0.05秒かけて音量を 0 にフェードアウト
      gainNode.gain.setTargetAtTime(0, context.currentTime, 0.05)

      // フェードアウト完了後（約60ms後）に AudioContext を完全休止
      setTimeout(async () => {
        if (!state.isPlaying && context.state === "running") {
          await context.suspend()
        }
      }, 60)

      state = { isPlaying: false, context, gainNode, noiseNode }
      render(state)
    } else {
      if (context.state === "suspended") await context.resume()

      // 再生: 現在選択中のノイズを設定し、スライダーの音量へフェードイン
      const noiseType = validNoiseType(noiseSelect.value)
        ? noiseSelect.value
        : "white"
      setNoiseType(noiseType, noiseNode)

      const targetVolume = parseFloat(volumeInput.value)
      gainNode.gain.setTargetAtTime(targetVolume, context.currentTime, 0.05)

      state = { isPlaying: true, context, gainNode, noiseNode }
      render(state)
    }
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
    const { noiseNode } = state
    if (!noiseNode) return
    const noiseType = validNoiseType(noiseSelect.value)
      ? noiseSelect.value
      : "white"
    // 再生中でも停止中でも、Worklet にメッセージを送るだけで即座に切り替わる
    setNoiseType(noiseType, noiseNode)
  })

  render(state)
}

main()
