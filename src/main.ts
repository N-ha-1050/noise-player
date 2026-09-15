import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

import { startNoise, stopNoise } from "./audio/audioEngine"
import { validNoiseType } from "./audio/noiseCreators"

type State =
  | {
      isPlaying: true
      noiseSource: AudioBufferSourceNode
    }
  | {
      isPlaying: false
      noiseSource: null
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

function main() {
  const playButton = document.getElementById("play-button") as HTMLButtonElement
  const volumeInput = document.getElementById(
    "volume-input",
  ) as HTMLInputElement
  const noiseSelect = document.getElementById(
    "noise-select",
  ) as HTMLSelectElement

  const context = new AudioContext()

  const gainNode = context.createGain()
  gainNode.gain.value = parseFloat(volumeInput.value)
  gainNode.connect(context.destination)

  let state: State = {
    isPlaying: false,
    noiseSource: null,
  }

  function handleEnded(ev: Event) {
    if (state.isPlaying && state.noiseSource === ev.target) {
      state = {
        isPlaying: false,
        noiseSource: null,
      }
      render(state)
    }
  }

  playButton.addEventListener("click", async () => {
    if (context.state === "suspended") await context.resume()

    if (state.isPlaying) {
      // 停止
      stopNoise(state.noiseSource)
      state = {
        isPlaying: false,
        noiseSource: null,
      }
      render(state)
    } else {
      // 再生
      const noiseType = validNoiseType(noiseSelect.value)
        ? noiseSelect.value
        : "white"
      const source = startNoise(context, gainNode, noiseType, handleEnded)

      state = {
        isPlaying: true,
        noiseSource: source,
      }
      render(state)
    }
  })

  volumeInput.addEventListener("input", () => {
    gainNode.gain.value = parseFloat(volumeInput.value)
  })

  noiseSelect.addEventListener("change", async () => {
    if (!state.isPlaying) return

    stopNoise(state.noiseSource)
    const noiseType = validNoiseType(noiseSelect.value)
      ? noiseSelect.value
      : "white"
    if (context.state === "suspended") await context.resume()
    const source = startNoise(context, gainNode, noiseType, handleEnded)
    state = {
      isPlaying: true,
      noiseSource: source,
    }
    render(state)
  })

  render(state)
}

main()
