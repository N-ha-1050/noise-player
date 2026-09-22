import "@fontsource-variable/noto-sans/wght.css"
import "@fontsource-variable/noto-sans-jp/wght.css"
import "@fontsource-variable/noto-emoji/wght.css"
import "@fontsource-variable/material-symbols-outlined/wght.css"

import "./style.css"

import {
  type State,
  setNoiseType,
  setVolume,
  startPlayback,
  stopPlayback,
} from "./audio/audioEngine"
import {
  type MediaSessionActionHandlers,
  setupMediaSession,
} from "./media/mediaSession"
import { getTypedElementById } from "./utils"

function main() {
  const playButton = getTypedElementById("button", "play-button")
  const playButtonIcon = getTypedElementById("span", "play-button-icon")
  const playButtonLabel = getTypedElementById("span", "play-button-label")
  const volumeInput = getTypedElementById("input", "volume-input")
  const noiseSelect = getTypedElementById("select", "noise-select")
  const previousButton = getTypedElementById("button", "previous-button")
  const nextButton = getTypedElementById("button", "next-button")
  if (
    !playButton ||
    !playButtonIcon ||
    !playButtonLabel ||
    !volumeInput ||
    !noiseSelect ||
    !previousButton ||
    !nextButton
  )
    return

  const state: State = {
    isPlaying: false,
    audioContext: null,
    gainNode: null,
    workletNode: null,
    audioElement: null,
  }

  const render = (state: State) => {
    playButton.setAttribute("aria-pressed", state.isPlaying.toString())
    playButtonIcon.textContent = state.isPlaying ? "pause" : "play_arrow"
    playButtonLabel.textContent = state.isPlaying ? "Pause" : "Play"
  }

  const optionsLength = noiseSelect.options.length
  const getPreviousNoiseOption = () =>
    noiseSelect.options[
      (noiseSelect.selectedIndex - 1 + optionsLength) % optionsLength
    ]
  const getNextNoiseOption = () =>
    noiseSelect.options[(noiseSelect.selectedIndex + 1) % optionsLength]

  playButton.addEventListener("click", async () =>
    render(
      state.isPlaying
        ? Object.assign(state, stopPlayback(state))
        : Object.assign(
            state,
            await startPlayback(
              state,
              parseFloat(volumeInput.value),
              noiseSelect.value,
              noiseSelect.options[noiseSelect.selectedIndex].text,
            ),
          ),
    ),
  )
  volumeInput.addEventListener("input", () =>
    setVolume(state, parseFloat(volumeInput.value)),
  )
  noiseSelect.addEventListener("change", () =>
    setNoiseType(
      state,
      noiseSelect.value,
      noiseSelect.options[noiseSelect.selectedIndex].text,
    ),
  )
  previousButton.addEventListener("click", () => {
    const previousOption = getPreviousNoiseOption()
    noiseSelect.value = previousOption.value
    setNoiseType(state, previousOption.value, previousOption.text)
  })
  nextButton.addEventListener("click", () => {
    const nextOption = getNextNoiseOption()
    noiseSelect.value = nextOption.value
    setNoiseType(state, nextOption.value, nextOption.text)
  })

  const actionHandlers: MediaSessionActionHandlers = [
    [
      "play",
      async () =>
        render(
          Object.assign(
            state,
            await startPlayback(
              state,
              parseFloat(volumeInput.value),
              noiseSelect.value,
              noiseSelect.options[noiseSelect.selectedIndex].text,
            ),
          ),
        ),
    ],
    ["pause", () => render(Object.assign(state, stopPlayback(state)))],
    ["stop", () => render(Object.assign(state, stopPlayback(state)))],
    [
      "previoustrack",
      () => {
        const previousOption = getPreviousNoiseOption()
        noiseSelect.value = previousOption.value
        setNoiseType(state, previousOption.value, previousOption.text)
      },
    ],
    [
      "nexttrack",
      () => {
        const nextOption = getNextNoiseOption()
        noiseSelect.value = nextOption.value
        setNoiseType(state, nextOption.value, nextOption.text)
      },
    ],

    // シーク操作（10秒戻る/進む・シークバー操作）は無効化
    ["seekto", null],
    ["seekbackward", null],
    ["seekforward", null],
  ]

  setupMediaSession(actionHandlers)
}

main()
