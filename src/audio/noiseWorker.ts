class NoiseProcessor extends AudioWorkletProcessor {
  private noiseType = "white"

  // ピンクノイズ用のフィルター状態変数
  private b0 = 0
  private b1 = 0
  private b2 = 0
  private b3 = 0
  private b4 = 0
  private b5 = 0
  private b6 = 0

  // ブラウンノイズ用の状態変数
  private lastOutput = 0.0

  constructor() {
    super()
    // メインスレッドからの指示（ノイズ種類の変更など）を受信
    this.port.onmessage = (event) => {
      if (event.data.type === "SET_NOISE") {
        this.noiseType = event.data.noiseType
      }
    }
  }
  // 128サンプルごとに呼ばれる
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0] // 最初の出力チャンネル群
    const channel = output[0] // モノラル（Lch）
    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1
      if (this.noiseType === "white") {
        channel[i] = white * 0.5
      } else if (this.noiseType === "pink") {
        this.b0 = 0.99886 * this.b0 + white * 0.0555179
        this.b1 = 0.99332 * this.b1 + white * 0.0750759
        this.b2 = 0.969 * this.b2 + white * 0.153852
        this.b3 = 0.8665 * this.b3 + white * 0.3104856
        this.b4 = 0.55 * this.b4 + white * 0.5329522
        this.b5 = -0.76161 * this.b5 - white * 0.016898
        channel[i] =
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
      } else if (this.noiseType === "brown") {
        this.lastOutput = (this.lastOutput + 0.02 * white) / 1.02
        channel[i] = this.lastOutput * 3.5 * 0.5
      }
    }
    // ステレオ対応（右チャンネルがあれば同じデータをコピー）
    if (output[1]) {
      output[1].set(channel)
    }
    return true // true を返すと継続実行
  }
}
registerProcessor("noise-processor", NoiseProcessor)
