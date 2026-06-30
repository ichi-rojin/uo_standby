// 責務: キャラクターの移動・徘徊・追跡
import { WORLD } from '../config/constants';
import type { Character } from '../entities/character';
import { healthDebuff } from './needsSystem';

const BASE_SPEED = 6;

export function moveToward(c: Character, tx: number, ty: number): void {
  const dx = tx - c.pos.x;
  const dy = ty - c.pos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = BASE_SPEED * (0.5 + c.ab.agility / 50) * healthDebuff(c);
  c.vel.x = (dx / dist) * speed;
  c.vel.y = (dy / dist) * speed;
  c.pos.x += c.vel.x;
  c.pos.y += c.vel.y;
  clamp(c);
  c.animPhase += 0.3;
}

export function wander(c: Character, rand: () => number): void {
  if (rand() < 0.05 || (c.vel.x === 0 && c.vel.y === 0)) {
    const ang = rand() * Math.PI * 2;
    const speed = BASE_SPEED * (0.4 + c.ab.agility / 60);
    c.vel.x = Math.cos(ang) * speed;
    c.vel.y = Math.sin(ang) * speed;
  }
  c.pos.x += c.vel.x;
  c.pos.y += c.vel.y;
  clamp(c);
  c.animPhase += 0.2;
}

function clamp(c: Character): void {
  const m = 20;
  if (c.pos.x < m) { c.pos.x = m; c.vel.x = Math.abs(c.vel.x); }
  if (c.pos.x > WORLD.WIDTH - m) { c.pos.x = WORLD.WIDTH - m; c.vel.x = -Math.abs(c.vel.x); }
  if (c.pos.y < m) { c.pos.y = m; c.vel.y = Math.abs(c.vel.y); }
  if (c.pos.y > WORLD.HEIGHT - m) { c.pos.y = WORLD.HEIGHT - m; c.vel.y = -Math.abs(c.vel.y); }
}