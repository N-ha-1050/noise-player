import { type NoiseType, noiseBufferCreators } from "./noiseCreators"
import noiseProcessorUrl from "./noiseWorker?worker&url"

export async function ensureAudioInitialized(
  context: AudioContext | null,
  gainNode: GainNode | null,
  noiseNode: AudioWorkletNode | null,
) {
  if (context && gainNode && noiseNode) {
    return { context, gainNode, noiseNode }
  }

  const newContext = new AudioContext()
  const newGainNode = initializeGainNode(newContext)
  const newNoiseNode = await initializeNoiseNode(newContext)

  newNoiseNode.connect(newGainNode).connect(newContext.destination)

  return {
    context: newContext,
    gainNode: newGainNode,
    noiseNode: newNoiseNode,
  }
}

export async function initializeNoiseNode(context: AudioContext) {
  await context.audioWorklet.addModule(noiseProcessorUrl)

  const noiseNode = new AudioWorkletNode(context, "noise-processor", {
    outputChannelCount: [2], // ステレオ出力
  })

  return noiseNode
}

export function initializeGainNode(context: AudioContext) {
  const gainNode = context.createGain()
  gainNode.gain.setValueAtTime(0, context.currentTime) // 初期音量は 0（ミュート）にしておき、再生時にフェードインさせる

  return gainNode
}

export function setNoiseType(type: string, noiseNode: AudioWorkletNode) {
  noiseNode.port.postMessage({ type: "SET_NOISE", noiseType: type })
}

export function startNoise(
  context: AudioContext,
  gainNode: GainNode,
  noiseType: NoiseType,
  handleEnded: AudioBufferSourceNode["onended"],
) {
  const createNoiseBuffer = noiseBufferCreators[noiseType]
  const buffer = createNoiseBuffer(context, 1)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true

  source.connect(gainNode)
  if (handleEnded) source.addEventListener("ended", handleEnded)
  source.start()

  return source
}

export function stopNoise(source: AudioBufferSourceNode) {
  source.stop()
  source.disconnect()
}
