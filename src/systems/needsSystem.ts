// 責務: 欲求の時間減衰と健康度デバフ・回復処理
import { clamp } from '../util/math';
import { NEED, HEALTH, RECOVER, STAT } from '../config/constants';
import type { Character, Stats } from '../domain/types';

const DEBUFF_KEYS: (keyof Stats)[] = ['power', 'agility', 'reaction', 'perception', 'dexterity', 'magic'];

export function decayNeeds(c: Character): void {
  c.needs.food = clamp(c.needs.food - NEED.DECAY_FOOD, 0, NEED.MAX);
  c.needs.sleep = clamp(c.needs.sleep - NEED.DECAY_SLEEP, 0, NEED.MAX);
  c.needs.libido = clamp(c.needs.libido + NEED.DECAY_LIBIDO, 0, NEED.MAX);

  if (c.needs.food <= 0) {
    if (c.inventory.food > 0) {
      c.inventory.food -= 1;
      c.needs.food = NEED.MAX * 0.6;
    } else {
      c.stats.health = clamp(c.stats.health - HEALTH.FORAGE_DAMAGE, 0, HEALTH.MAX);
    }
  } else if (c.needs.food < NEED.THRESHOLD_LOW && c.inventory.food > 0) {
    c.inventory.food -= 1;
    c.needs.food = clamp(c.needs.food + 40, 0, NEED.MAX);
  }

  applyHealthDebuff(c);
}

function applyHealthDebuff(c: Character): void {
  if (c.stats.health >= HEALTH.DEBUFF_THRESHOLD) return;
  const deficit = HEALTH.DEBUFF_THRESHOLD - c.stats.health;
  const penalty = Math.round(deficit * NEED.HUNGER_HEALTH_PENALTY * 0.05);
  for (const k of DEBUFF_KEYS) {
    const base = c.stats[k];
    c.stats[k] = clamp(base - penalty, STAT.MIN, base);
  }
}

export function recoverAtSafe(c: Character): boolean {
  let recovered = false;
  if (c.stats.hp < c.stats.hpMax) {
    c.stats.hp = clamp(c.stats.hp + RECOVER.HP_PER_TICK, 0, c.stats.hpMax);
    recovered = true;
  }
  if (c.stats.mp < c.stats.mpMax) {
    c.stats.mp = clamp(c.stats.mp + RECOVER.MP_PER_TICK, 0, c.stats.mpMax);
    recovered = true;
  }
  if (c.stats.health < HEALTH.MAX) {
    c.stats.health = clamp(c.stats.health + RECOVER.HEALTH_PER_TICK, 0, HEALTH.MAX);
    recovered = true;
  }
  c.needs.food = NEED.MAX;
  c.needs.sleep = NEED.MAX;
  return recovered;
}