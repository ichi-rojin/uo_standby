// 責務: 攻撃射程判定・ダメージ計算・生殺与奪処理
import { COMBAT } from '../config/constants';
import type { Character } from '../entities/character';
import { healthDebuff } from './needsSystem';
import type { WeaponType } from '../domain/types';

export function weaponRange(c: Character): number {
  const w: WeaponType = c.inv.weapon;
  if (w === 'sword') return COMBAT.SWORD_RANGE;
  if (w === 'pole') return COMBAT.POLE_RANGE;
  if (w === 'bow') {
    const t = Math.min(1, c.ab.dexterity / 25);
    return COMBAT.BOW_RANGE_BASE + (COMBAT.BOW_RANGE_MAX - COMBAT.BOW_RANGE_BASE) * t;
  }
  const t = Math.min(1, c.ab.magic / 25);
  return COMBAT.MAGIC_RANGE_BASE + (COMBAT.MAGIC_RANGE_MAX - COMBAT.MAGIC_RANGE_BASE) * t;
}

export function computeDamage(attacker: Character): number {
  const buff = attacker.buffTicks > 0 ? 1.3 : 1;
  const debuff = attacker.debuffTicks > 0 ? 0.7 : 1;
  const hd = healthDebuff(attacker);
  if (attacker.inv.weapon === 'magic') {
    return Math.max(1, attacker.ab.magic * 1.2 * buff * debuff * hd);
  }
  return Math.max(1, attacker.ab.power * buff * debuff * hd);
}

export function dodge(defender: Character): boolean {
  const chance = Math.min(0.6, defender.ab.reaction / 60);
  return Math.random() < chance;
}