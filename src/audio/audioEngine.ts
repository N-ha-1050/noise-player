import { type NoiseType, noiseBufferCreators } from "./noiseCreators"

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
