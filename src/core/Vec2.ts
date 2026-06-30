// 責務: 2次元ベクトルユーティリティ(純関数)
export interface Vec2 {
  x: number;
  y: number;
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function moveToward(from: Vec2, to: Vec2, maxStep: number): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxStep || d === 0) return { x: to.x, y: to.y };
  return { x: from.x + (dx / d) * maxStep, y: from.y + (dy / d) * maxStep };
}