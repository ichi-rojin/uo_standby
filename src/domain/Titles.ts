// 責務: 性格・能力・地位・スキルから通り名を算出
import type { Character } from './types';

export function computeTitle(c: Character): string {
  if (c.kind === 'boss') return '魔王';
  if (c.kind === 'monster') return '魔物';
  if (c.evil) {
    if (c.stats.power > 70) return '無頼の';
    return '夜盗の';
  }
  if (c.stats.honor > 60) return '誉れ高き';
  if (c.stats.magic > c.stats.power && c.stats.magic > 60) return '賢者';
  if (c.stats.power > 70) return '剛剣の';
  if (c.skills.weaponBow > 60) return '射手';
  if (c.stats.moral > 8) return '聖者';
  if (c.stats.moral < -8) return '悪漢';
  return '旅の';
}