// 責務: 能力値・スキルの生成と、健康度デバフ適用後の実効値計算。

import { STATS_RANGE } from '../config/GameConfig';
import { Rng } from '../core/Rng';
import { Attributes, Skills } from './types';

export function rollAttributes(rng: Rng): Attributes {
  const r = (): number =>
    rng.intRange(STATS_RANGE.ATTR_MIN, STATS_RANGE.ATTR_MAX);
  return {
    build: r(),
    agility: r(),
    reaction: r(),
    perception: r(),
    dexterity: r(),
    magicPower: r(),
  };
}

export function rollSkills(rng: Rng): Skills {
  const r = (): number =>
    rng.intRange(STATS_RANGE.SKILL_MIN, Math.floor(STATS_RANGE.SKILL_MAX / 2));
  return {
    sword: r(),
    polearm: r(),
    bow: r(),
    magicAttack: r(),
    magicBuff: r(),
    magicDebuff: r(),
    cartography: r(),
  };
}

/**
 * 健康度が閾値を下回ると、減少量に応じて能力値へデバフ倍率を返す。
 * 1.0 = デバフ無し。
 */
export function healthDebuffMultiplier(health: number): number {
  if (health >= STATS_RANGE.HEALTH_DEBUFF_THRESHOLD) {
    return 1.0;
  }
  const deficit = STATS_RANGE.HEALTH_DEBUFF_THRESHOLD - health;
  const ratio = deficit / STATS_RANGE.HEALTH_DEBUFF_THRESHOLD;
  // 最大50%減
  return Math.max(0.5, 1.0 - ratio * 0.5);
}

/** デバフ適用後の実効攻撃力を算出 */
export function effectiveAttack(
  attr: Attributes,
  skills: Skills,
  health: number
): number {
  const mult = healthDebuffMultiplier(health);
  const base =
    attr.build * 0.4 +
    attr.agility * 0.3 +
    attr.dexterity * 0.2 +
    (skills.sword + skills.polearm + skills.bow) * 0.05;
  return base * mult;
}

/** デバフ適用後の実効防御力を算出 */
export function effectiveDefense(attr: Attributes, health: number): number {
  const mult = healthDebuffMultiplier(health);
  return (attr.build * 0.3 + attr.reaction * 0.3 + attr.perception * 0.2) * mult;
}