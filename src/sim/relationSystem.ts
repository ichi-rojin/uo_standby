// 責務: NPC間の感情値変化(友情/憎悪/恋愛)管理
import type { Character } from '../entities/character';

export function adjustRelation(a: Character, b: Character, delta: number): void {
  const cur = a.relations[b.id] ?? 0;
  a.relations[b.id] = Math.max(-100, Math.min(100, cur + delta));
}

export function relationLabel(value: number): string {
  if (value >= 60) return '恋愛';
  if (value >= 30) return '友情';
  if (value <= -60) return '憎悪';
  if (value <= -30) return '好敵手';
  return '中立';
}