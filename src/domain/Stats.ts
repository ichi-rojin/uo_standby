// File: src/domain/Stats.ts
// 責務: 能力値・スキル・所持品・欲求の初期生成と派生値計算ロジック。

import { RNG } from '../core/RNG';
import { StatsConfig } from '../config/GameConfig';
import {
  Attributes,
  Skills,
  Inventory,
  Desires,
  WeaponType,
} from './types';

export function rollAttributes(rng: RNG): Attributes {
  const r = (): number => rng.int(StatsConfig.ATTR_MIN, StatsConfig.ATTR_MAX);
  return {
    physique: r(),
    agility: r(),
    reaction: r(),
    perception: r(),
    dexterity: r(),
    magicPower: r(),
  };
}

export function rollSkills(rng: RNG): Skills {
  const r = (): number => rng.int(StatsConfig.SKILL_MIN, StatsConfig.SKILL_MAX);
  return {
    sword: r(),
    polearm: r(),
    bow: r(),
    magicAttack: r(),
    magicBuff: r(),
    magicDebuff: r(),
    mapKnowledge: r(),
  };
}

export function rollInventory(rng: RNG, weapon: WeaponType): Inventory {
  return {
    weapon,
    food: rng.int(3, 12),
    valuables: 0,
    money: rng.int(0, 100),
  };
}

export function rollDesires(rng: RNG): Desires {
  const r = (): number => rng.range(0, 1);
  return {
    primal: r(),
    money: r(),
    honor: r(),
    growth: r(),
    skill: r(),
  };
}

export function computePower(attr: Attributes, skills: Skills): number {
  const attrSum =
    attr.physique +
    attr.agility +
    attr.reaction +
    attr.perception +
    attr.dexterity +
    attr.magicPower;
  const skillSum =
    skills.sword +
    skills.polearm +
    skills.bow +
    skills.magicAttack +
    skills.magicBuff +
    skills.magicDebuff;
  return attrSum + skillSum * 0.5;
}

export function pickWeapon(rng: RNG): WeaponType {
  return rng.pick([WeaponType.Sword, WeaponType.Polearm, WeaponType.Bow]);
}

export function healthDebuffFactor(health: number): number {
  if (health >= StatsConfig.HEALTH_DEBUFF_THRESHOLD) {
    return 1;
  }
  const deficit = StatsConfig.HEALTH_DEBUFF_THRESHOLD - health;
  const factor = 1 - deficit / (StatsConfig.HEALTH_DEBUFF_THRESHOLD * 2);
  return Math.max(0.4, factor);
}