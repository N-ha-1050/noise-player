/**
 * ホワイトノイズを格納した AudioBuffer を生成します。
 * 全周波数帯域でパワー密度が一定（S(f) ∝ 1）となるよう、
 * 一様乱数（Math.random）を [-1, 1] の範囲にスケーリングして直接生成します。
 *
 * @param {BaseAudioContext} context - AudioContext インスタンス。
 * @param {number} duration - バッファーの再生時間（秒）。
 * @returns {AudioBuffer} ホワイトノイズが書き込まれた AudioBuffer オブジェクト。
 *
 * @example
 * const context = new AudioContext();
 * const whiteBuffer = createWhiteNoiseBuffer(context, 3);
 */
function createWhiteNoiseBuffer(context: AudioContext, duration: number) {
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1 // -1.0 to 1.0
  }

  return buffer
}

/**
 * ピンクノイズ（1/f ノイズ）を格納した AudioBuffer を生成します。
 * パワースペクトル密度が周波数に反比例（S(f) ∝ 1/f）し、
 * 1 オクターブあたり約 3 dB 減衰する特性を持ちます。
 * 内部処理には Paul Kellet 氏による 6 段の 1 次 IIR フィルター近似アルゴリズムを採用しています。
 *
 * @param {BaseAudioContext} context - AudioContext インスタンス。
 * @param {number} duration - バッファーの再生時間（秒）。
 * @returns {AudioBuffer} ピンクノイズが書き込まれた AudioBuffer オブジェクト。
 *
 * @example
 * const context = new AudioContext();
 * const pinkBuffer = createPinkNoiseBuffer(context, 3);
 */
function createPinkNoiseBuffer(context: AudioContext, duration: number) {
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1

    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.76161 * b5 - white * 0.016898

    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    data[i] *= 0.11 // クリッピング（クリップ音）防止のためのスケール調整
    b6 = white * 0.115926
  }
  return buffer
}

/**
 * ブラウンノイズ（レッドノイズ、1/f^2 ノイズ）を格納した AudioBuffer を生成します。
 * パワースペクトル密度が周波数の 2 乗に反比例（S(f) ∝ 1/f^2）し、
 * 1 オクターブあたり約 6 dB 減衰する特性を持ちます。
 * ホワイトノイズの離散積分（ランダムウォーク）に対し、
 * 直流成分（DC オフセット）の拡散や振り切れを防ぐ漏れ積分器（Leaky Integrator）を適用して生成します。
 *
 * @param {BaseAudioContext} context - AudioContext インスタンス。
 * @param {number} duration - バッファーの再生時間（秒）。
 * @returns {AudioBuffer} ブラウンノイズが書き込まれた AudioBuffer オブジェクト。
 *
 * @example
 * const context = new AudioContext();
 * const brownBuffer = createBrownNoiseBuffer(context, 3);
 */
function createBrownNoiseBuffer(context: AudioContext, duration: number) {
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  let lastOutput = 0.0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    // 漏れ係数 1.02 による衰減付き積分
    data[i] = (lastOutput + 0.02 * white) / 1.02
    lastOutput = data[i]
    data[i] *= 3.5 // 音量補正
  }
  return buffer
}

export const noiseBufferCreators = {
  white: createWhiteNoiseBuffer,
  pink: createPinkNoiseBuffer,
  brown: createBrownNoiseBuffer,
} as const satisfies Record<
  string,
  (context: AudioContext, duration: number) => AudioBuffer
>

export type NoiseType = keyof typeof noiseBufferCreators

export function validNoiseType(value: string): value is NoiseType {
  return Object.hasOwn(noiseBufferCreators, value)
}
