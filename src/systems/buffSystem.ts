// 責務: バフ・デバフの付与と寿命管理、エフェクト発火
import { clamp } from '../util/math';
import { STAT, COMBAT } from '../config/constants';
import type { Character } from '../domain/types';
import type { GameState } from '../state/gameState';

export function tickBuffs(c: Character): void {
  for (let i = c.buffs.length - 1; i >= 0; i--) {
    const b = c.buffs[i];
    b.ttl -= 1;
    if (b.ttl <= 0) {
      c.stats[b.stat] = clamp(c.stats[b.stat] - b.amount, STAT.MIN, STAT.MAX);
      c.buffs.splice(i, 1);
    }
  }
}

export function applyBuff(state: GameState, target: Character, amount: number, ttl: number): void {
  if (target.stats.mp < COMBAT.MP_COST_BUFF) return;
  target.stats.power = clamp(target.stats.power + amount, STAT.MIN, STAT.MAX);
  target.buffs.push({ stat: 'power', amount, ttl });
  target.stats.mp -= COMBAT.MP_COST_BUFF;
  state.addEffect(target.x, target.y, amount >= 0 ? 'buff' : 'debuff', amount, 14);
}

export function castHeal(state: GameState, caster: Character, target: Character): void {
  if (caster.stats.mp < COMBAT.MP_COST_HEAL) return;
  caster.stats.mp -= COMBAT.MP_COST_HEAL;
  const amount = Math.round(caster.stats.magic * COMBAT.HEAL_FACTOR);
  target.stats.hp = clamp(target.stats.hp + amount, 0, target.stats.hpMax);
  state.addEffect(target.x, target.y, 'heal', amount, 14);
  if (caster.skills.spells.length > 0) {
    state.addTalk(caster.id, target.id, `癒したまえ、${caster.skills.spells[0]}！`);
  }
}