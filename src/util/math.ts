// 責務: 汎用数学ユーティリティ（距離・クランプ・正規化）
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt(dist2(ax, ay, bx, by));
}

export function normalize10(value: number, divisor: number): number {
  const r = value / divisor;
  return clamp(Math.round(r), 1, 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}