abstract class NoiseCreator {
  private gain: number
  public abstract noiseType: string

  constructor(gain: number) {
    this.gain = gain
  }

  abstract create(): number

  assign(audioArray: Float32Array) {
    for (let i = 0; i < audioArray.length; i++) {
      audioArray[i] = this.create() * this.gain
    }
  }
}

/**
 * （エラーフォールバック用）無音を格納します。
 */
class SilentNoiseCreator extends NoiseCreator {
  public noiseType = "silent"

  create() {
    return 0
  }
}

/**
 * ホワイトノイズを格納します。
 * 全周波数帯域でパワー密度が一定（S(f) ∝ 1）となるよう、
 * 一様乱数（Math.random）を [-1, 1] の範囲にスケーリングして直接生成します。
 */
class WhiteNoiseCreator extends NoiseCreator {
  public noiseType = "white"

  create() {
    return Math.random() * 2 - 1
  }
}

/**
 * ピンクノイズ（1/f ノイズ）を格納します。
 * パワースペクトル密度が周波数に反比例（S(f) ∝ 1/f）し、
 * 1 オクターブあたり約 3 dB 減衰する特性を持ちます。
 * 内部処理には Paul Kellet 氏による 6 段の 1 次 IIR フィルター近似アルゴリズムを採用しています。
 */
class PinkNoiseCreator extends NoiseCreator {
  public noiseType = "pink"

  private b0 = 0
  private b1 = 0
  private b2 = 0
  private b3 = 0
  private b4 = 0
  private b5 = 0
  private b6 = 0

  create() {
    const white = Math.random() * 2 - 1
    this.b0 = 0.99886 * this.b0 + white * 0.0555179
    this.b1 = 0.99332 * this.b1 + white * 0.0750759
    this.b2 = 0.969 * this.b2 + white * 0.153852
    this.b3 = 0.8665 * this.b3 + white * 0.3104856
    this.b4 = 0.55 * this.b4 + white * 0.5329522
    this.b5 = -0.76161 * this.b5 - white * 0.016898
    const pink =
      (this.b0 +
        this.b1 +
        this.b2 +
        this.b3 +
        this.b4 +
        this.b5 +
        this.b6 +
        white * 0.5362) *
      0.11
    this.b6 = white * 0.115926
    return pink
  }
}

/**
 * ブラウンノイズ（レッドノイズ、1/f^2 ノイズ）を格納します。
 * パワースペクトル密度が周波数の 2 乗に反比例（S(f) ∝ 1/f^2）し、
 * 1 オクターブあたり約 6 dB 減衰する特性を持ちます。
 * ホワイトノイズの離散積分（ランダムウォーク）に対し、
 * 直流成分（DC オフセット）の拡散や振り切れを防ぐ漏れ積分器（Leaky Integrator）を適用して生成します。
 */
class BrownNoiseCreator extends NoiseCreator {
  public noiseType = "brown"

  private lastOutput = 0.0

  create() {
    const white = Math.random() * 2 - 1
    this.lastOutput = (this.lastOutput + 0.02 * white) / 1.02
    return this.lastOutput * 3.5
  }
}

class NoiseProcessor extends AudioWorkletProcessor {
  private noiseType = "white"
  private noiseCreators: NoiseCreator[] = []

  constructor() {
    super()
    this.port.onmessage = (event) => {
      if (event.data.type === "SET_TYPE") {
        this.noiseType = event.data.noiseType
      }
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const numChannels = outputs[0].length
    const sameLength = this.noiseCreators.length === numChannels
    for (let i = 0; i < numChannels; i++) {
      if (
        !sameLength ||
        !this.noiseCreators[i] ||
        this.noiseCreators[i].noiseType !== this.noiseType
      ) {
        switch (this.noiseType) {
          case "white":
            this.noiseCreators[i] = new WhiteNoiseCreator(1 / numChannels)
            break
          case "pink":
            this.noiseCreators[i] = new PinkNoiseCreator(1 / numChannels)
            break
          case "brown":
            this.noiseCreators[i] = new BrownNoiseCreator(1 / numChannels)
            break
          default:
            this.noiseCreators[i] = new SilentNoiseCreator(1 / numChannels)
            break
        }
      }
      this.noiseCreators[i].assign(outputs[0][i])
    }
    return true
  }
}

registerProcessor("noise-processor", NoiseProcessor)
