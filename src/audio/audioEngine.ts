import noiseProcessorUrl from "./noiseWorker?worker&url"

export async function ensureAudioInitialized(
  context: AudioContext | null,
  gainNode: GainNode | null,
  noiseNode: AudioWorkletNode | null,
  anchorAudio: HTMLAudioElement | null,
) {
  if (context && gainNode && noiseNode && anchorAudio) {
    return { context, gainNode, noiseNode, anchorAudio }
  }

  const newContext = new AudioContext()
  const newGainNode = initializeGainNode(newContext)
  const newNoiseNode = await initializeNoiseNode(newContext)

  newNoiseNode.connect(newGainNode).connect(newContext.destination)

  const dest = initializeMediaAnchorNode(newContext)
  newGainNode.connect(dest)

  const newAnchorAudio = new Audio()
  newAnchorAudio.srcObject = dest.stream
  newAnchorAudio.volume = 0

  return {
    context: newContext,
    gainNode: newGainNode,
    noiseNode: newNoiseNode,
    anchorAudio: newAnchorAudio,
  }
}

async function initializeNoiseNode(context: AudioContext) {
  await context.audioWorklet.addModule(noiseProcessorUrl)

  const noiseNode = new AudioWorkletNode(context, "noise-processor", {
    outputChannelCount: [2], // ステレオ出力
  })

  return noiseNode
}

function initializeGainNode(context: AudioContext) {
  const gainNode = context.createGain()
  gainNode.gain.setValueAtTime(0, context.currentTime) // 初期音量は 0（ミュート）にしておき、再生時にフェードインさせる

  return gainNode
}

function initializeMediaAnchorNode(context: AudioContext) {
  const dest = context.createMediaStreamDestination()
  return dest
}

export function setNoiseType(type: string, noiseNode: AudioWorkletNode) {
  noiseNode.port.postMessage({ type: "SET_NOISE", noiseType: type })
}
