import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

function createWhiteNoiseBuffer(context: AudioContext, duration: number) {
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1 // -1.0 to 1.0
  }

  return buffer
}

type State =
  | {
      isPlaying: true
      whiteNoiseSource: AudioBufferSourceNode
    }
  | {
      isPlaying: false
      whiteNoiseSource: null
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

  const context = new AudioContext()
  const buffer = createWhiteNoiseBuffer(context, 1)

  const gainNode = context.createGain()
  gainNode.gain.value = parseFloat(volumeInput.value)
  gainNode.connect(context.destination)

  let state: State = {
    isPlaying: false,
    whiteNoiseSource: null,
  }

  playButton.addEventListener("click", () => {
    if (context.state === "suspended") context.resume()

    if (state.isPlaying) {
      // 停止
      state.whiteNoiseSource.stop()
      state.whiteNoiseSource.disconnect()
      state = {
        isPlaying: false,
        whiteNoiseSource: null,
      }
    } else {
      // 再生

      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true

      source.connect(gainNode)
      source.addEventListener("ended", () => {
        if (state.isPlaying && state.whiteNoiseSource === source) {
          state = {
            isPlaying: false,
            whiteNoiseSource: null,
          }
          render(state)
        }
      })
      source.start()

      state = {
        isPlaying: true,
        whiteNoiseSource: source,
      }
    }

    render(state)
  })

  volumeInput.addEventListener("input", () => {
    gainNode.gain.value = parseFloat(volumeInput.value)
  })

  render(state)
}

main()
