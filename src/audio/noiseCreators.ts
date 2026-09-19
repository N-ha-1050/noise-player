export const noiseTypes = ["white", "pink", "brown"] as const
export type NoiseType = (typeof noiseTypes)[number]

export function validNoiseType(value: string): value is NoiseType {
  return noiseTypes.map((value) => value).includes(value as NoiseType)
}
