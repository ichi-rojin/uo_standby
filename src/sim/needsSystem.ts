// 責務: 欲求の時間減衰と健康度への影響
import { NEED } from '../config/constants';
import type { Character } from '../entities/character';

export function updateNeeds(c: Character): void {
  c.needs.hunger = Math.min(NEED.MAX, c.needs.hunger + NEED.DECAY);
  c.needs.sleep = Math.min(NEED.MAX, c.needs.sleep + NEED.DECAY * 0.5);
  c.needs.lust = Math.min(NEED.MAX, c.needs.lust + NEED.DECAY * 0.3);
  c.needs.greed = Math.min(NEED.MAX, c.needs.greed + NEED.DECAY * 0.4);
  if (c.inv.food <= 0 && c.needs.hunger > 70) {
    c.ab.health = Math.max(0, c.ab.health - NEED.HUNGER_HEALTH_DROP);
  }
}

export function healthDebuff(c: Character): number {
  if (c.ab.health >= 70) return 1;
  return 0.5 + (c.ab.health / 70) * 0.5;
}