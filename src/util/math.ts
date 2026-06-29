// src/util/math.ts
// 責務: ベクトル演算・幾何ユーティリティを提供する。

import type { Vec2 } from '../domain/types';

export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt(distanceSq(a, b));
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function pointInTriangle(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(p1: Vec2, p2: Vec2, p3: Vec2): number {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export function randomPointInTriangle(
  a: Vec2,
  b: Vec2,
  c: Vec2,
  r1: number,
  r2: number,
): Vec2 {
  const sqrtR1 = Math.sqrt(r1);
  const x = (1 - sqrtR1) * a.x + sqrtR1 * (1 - r2) * b.x + sqrtR1 * r2 * c.x;
  const y = (1 - sqrtR1) * a.y + sqrtR1 * (1 - r2) * b.y + sqrtR1 * r2 * c.y;
  return { x, y };
}