/**
 * タグ名とIDを指定して要素を取得し、型を自動推論する関数
 */
export function getTypedElementById<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  id: string,
): HTMLElementTagNameMap[K] | null {
  const element = document.getElementById(id)
  if (!element) return null
  return element.tagName.toLowerCase() === tagName
    ? (element as HTMLElementTagNameMap[K])
    : null
}

/**
 * 10秒の無音 WAV の Blob URL を動的に生成する関数
 */
export function createSilentAudioUrl(
  durationSeconds = 10,
  sampleRate = 8000,
): string {
  const numSamples = sampleRate * durationSeconds
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = numSamples * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }
  // RIFF ヘッダー
  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, "WAVE")
  // fmt チャンク
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  // data チャンク
  writeString(36, "data")
  view.setUint32(40, dataSize, true)
  // 残り（波形データ部）はすべて 0（無音）のまま
  const blob = new Blob([buffer], { type: "audio/wav" })
  return URL.createObjectURL(blob)
}
