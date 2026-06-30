// 責務: 速度に基づく座標更新と世界端クランプ、アニメ位相更新
import { clamp } from '../util/math';
import { WORLD } from '../config/constants';
import type { Character } from '../domain/types';

const MAX_SPEED = 4;
const ANIM_SPEED = 0.3;

export function moveTowards(c: Character, tx: number, ty: number, speed: number): void {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) {
    c.vx = 0;
    c.vy = 0;
    return;
  }
  const s = Math.min(speed, MAX_SPEED);
  c.vx = (dx / len) * s;
  c.vy = (dy / len) * s;
}

export function applyMovement(c: Character): void {
  c.x = clamp(c.x + c.vx, WORLD.MARGIN * 0.5, WORLD.WIDTH - WORLD.MARGIN * 0.5);
  c.y = clamp(c.y + c.vy, WORLD.MARGIN * 0.5, WORLD.HEIGHT - WORLD.MARGIN * 0.5);
  if (c.vx !== 0 || c.vy !== 0) {
    c.animPhase += ANIM_SPEED;
  }
}

export function speedFromStats(c: Character): number {
  return 1 + (c.stats.agility / 100) * 2;
}