// 責務: 伝説武器の能力付与と通り名更新
import { LEGEND } from '../config/constants2';
import { genTitle } from '../core/nameGen';
import type { Character } from '../entities/character';

export function grantLegendary(c: Character, legendName: string, tick: number): string {
  c.ab.power += LEGEND.POWER_BONUS;
  c.ab.magic += LEGEND.MAGIC_BONUS;
  c.inv.valuables += 1;
  c.title = `${legendName}の所有者・${genTitle(c.ab.moral, c.ab.honor, c.inv.weapon)}`;
  c.addHistory(tick, `${legendName}を手に入れた`);
  return `${c.fullName()}が${legendName}を手に入れた！`;
}