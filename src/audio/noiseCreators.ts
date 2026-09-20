export const noiseTypes = ["white", "pink", "brown"] as const
export type NoiseType = (typeof noiseTypes)[number]

const noiseTypeSet = new Set<string>(noiseTypes)
export function validNoiseType(value: string): value is NoiseType {
  return noiseTypeSet.has(value)
}
