import {
  disableSeekBar,
  setMediaMetadata,
  setMediaPlaybackState,
} from "./../media/mediaSession"
import { createSilentAudioUrl } from "./../utils"
import noiseProcessorUrl from "./noiseWorker?worker&url"

export type State =
  | {
      isPlaying: false
      audioContext: null
      gainNode: null
      workletNode: null
      audioElement: null
    }
  | {
      isPlaying: boolean
      audioContext: AudioContext
      gainNode: GainNode
      workletNode: AudioWorkletNode
      audioElement: HTMLAudioElement
    }

async function initAudioContext(
  state: State,
  volume: number,
  noiseType: string,
  noiseTypeTitle: string,
) {
  if (state.audioContext) return state

  const newAudioContext = new AudioContext()
  await newAudioContext.audioWorklet.addModule(noiseProcessorUrl)

  const newGainNode = newAudioContext.createGain()
  const newWorkletNode = new AudioWorkletNode(
    newAudioContext,
    "noise-processor",
  )

  newWorkletNode.connect(newGainNode).connect(newAudioContext.destination)

  const newAudioElement = new Audio(createSilentAudioUrl(10))
  newAudioElement.loop = true

  setVolume(
    {
      isPlaying: state.isPlaying,
      audioContext: newAudioContext,
      gainNode: newGainNode,
      workletNode: newWorkletNode,
      audioElement: newAudioElement,
    },
    volume,
  )
  setNoiseType(
    {
      isPlaying: state.isPlaying,
      audioContext: newAudioContext,
      gainNode: newGainNode,
      workletNode: newWorkletNode,
      audioElement: newAudioElement,
    },
    noiseType,
    noiseTypeTitle,
  )
  disableSeekBar()

  return {
    isPlaying: state.isPlaying,
    audioContext: newAudioContext,
    gainNode: newGainNode,
    workletNode: newWorkletNode,
    audioElement: newAudioElement,
  }
}

export async function startPlayback(
  state: State,
  volume: number,
  noiseType: string,
  noiseTypeTitle: string,
) {
  const { audioContext, audioElement, ...restState } = await initAudioContext(
    state,
    volume,
    noiseType,
    noiseTypeTitle,
  )

  if (audioContext.state === "suspended") {
    await audioContext.resume()
  }
  await audioElement.play().catch(() => {
    console.debug(
      "Silent media element play was rejected; continuing audio output.",
    )
  })
  setMediaPlaybackState("playing")

  disableSeekBar()

  return { ...restState, isPlaying: true, audioContext, audioElement }
}

export function stopPlayback(state: State) {
  const { audioContext, audioElement } = state

  if (!audioContext) return state

  audioElement.pause()
  audioContext.suspend()
  setMediaPlaybackState("paused")

  return { ...state, isPlaying: false }
}

export function setVolume(state: State, volume: number) {
  const { audioContext, gainNode } = state

  if (!audioContext) return

  gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.05)
}

export function setNoiseType(
  state: State,
  noiseType: string,
  noiseTypeTitle: string,
) {
  const { workletNode } = state

  if (!workletNode) return

  workletNode.port.postMessage({
    type: "SET_TYPE",
    noiseType,
  })
  setMediaMetadata(noiseTypeTitle)
  disableSeekBar()
}
