// src/render/ColorUtil.ts
// 責務: 個体色（モンスター強弱による色味、NPCの個体差）生成と色変換を担う。

import { Rng } from '../util/rng';
import { clamp } from '../util/math';

export function monsterTintFromStrength(strength: number): number {
  // 強い個体ほどドス黒く、弱い個体ほど淡い。
  const s = clamp(strength, 0, 1);
  const base = 0.85 - s * 0.6;
  const r = Math.round(clamp(base + 0.15, 0, 1) * 255);
  const g = Math.round(clamp(base - 0.05, 0, 1) * 255);
  const b = Math.round(clamp(base - 0.1, 0, 1) * 255);
  return (r << 16) | (g << 8) | b;
}

export function npcTint(rng: Rng): number {
  const hue = rng.range(0.05, 0.65);
  return hslToHex(hue, 0.4, 0.7);
}

export function hslToHex(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(clamp(color, 0, 1) * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

export function applyGrayscale(tint: number): number {
  const r = (tint >> 16) & 0xff;
  const g = (tint >> 8) & 0xff;
  const b = tint & 0xff;
  const gray = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
  return (gray << 16) | (gray << 8) | gray;
}