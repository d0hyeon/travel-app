// 웹은 level(1~14, 작을수록 확대), RN 은 delta(작을수록 확대)로 배율을 다룬다.
export const DEFAULT_DELTA = 0.02

export function levelToDelta(level: number): number {
  return DEFAULT_DELTA * 2 ** (level - 3)
}

export function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta))
}
