// 責務: バイオームの色定義と座標からのバイオーム判定
import { COUNTS, WORLD } from '../config/constants';

export const BIOME_COLORS: readonly number[] = [
  0x3a5f3a, 0x6b8e3a, 0x9ca84b, 0x4b7a8e, 0x2e4a5f,
  0x7a5f3a, 0x8e6b4b, 0x5f5f7a, 0x4b8e6b, 0x6b4b5f,
];

export function biomeAt(x: number, y: number): number {
  const cols = Math.ceil(Math.sqrt(COUNTS.BIOMES));
  const cellW = WORLD.WIDTH / cols;
  const cellH = WORLD.HEIGHT / cols;
  const cx = Math.min(cols - 1, Math.floor(x / cellW));
  const cy = Math.min(cols - 1, Math.floor(y / cellH));
  return (cy * cols + cx) % COUNTS.BIOMES;
}