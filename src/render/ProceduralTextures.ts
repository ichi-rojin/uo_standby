// 責務: PixiJS Graphicsによるプロシージャル描画ヘルパー
import { Graphics } from 'pixi.js';
import { ENTITY, COLORS } from '../config/constants';
import type { Character } from '../entities/character';
import type { WeaponType } from '../domain/types';

export function monsterColor(hueSeed: number, power: number): number {
  const darkness = Math.min(1, power / 30);
  const base = 0.7 - darkness * 0.5;
  const r = Math.floor((0.4 + hueSeed * 0.3) * base * 255);
  const g = Math.floor((0.2 + (1 - hueSeed) * 0.2) * base * 255);
  const b = Math.floor((0.2 + hueSeed * 0.3) * base * 255);
  return (r << 16) | (g << 8) | b;
}

function weaponMark(g: Graphics, weapon: WeaponType, r: number): void {
  g.setStrokeStyle({ width: 2, color: 0xffffff });
  if (weapon === 'sword') {
    g.moveTo(0, -r).lineTo(0, -r - 8).stroke();
  } else if (weapon === 'pole') {
    g.moveTo(0, -r).lineTo(0, -r - 12).stroke();
  } else if (weapon === 'bow') {
    g.moveTo(-4, -r - 6).lineTo(4, -r - 6).stroke();
    g.moveTo(-4, -r - 10).lineTo(4, -r - 2).stroke();
  } else {
    g.circle(0, -r - 7, 3).fill({ color: 0x66ffff });
  }
}

export function drawNpcBody(g: Graphics, c: Character): void {
  g.clear();
  const r = ENTITY.NPC_RADIUS;
  const color = c.isBandit ? COLORS.BANDIT : c.gender === 'male' ? COLORS.NPC_MALE : COLORS.NPC_FEMALE;
  g.circle(0, -r * 0.5, r * 0.5).fill({ color });
  g.roundRect(-r * 0.5, 0, r, r, 2).fill({ color });
  weaponMark(g, c.inv.weapon, r);
}

export function drawMonsterBody(g: Graphics, c: Character): void {
  g.clear();
  const r = ENTITY.MONSTER_RADIUS;
  const color = monsterColor(c.hueSeed, c.ab.power);
  const spikes = 8;
  let started = false;
  for (let i = 0; i < spikes; i++) {
    const a1 = (i / spikes) * Math.PI * 2;
    const a2 = ((i + 0.5) / spikes) * Math.PI * 2;
    const ox = Math.cos(a1) * r;
    const oy = Math.sin(a1) * r;
    const ix = Math.cos(a2) * r * 0.45;
    const iy = Math.sin(a2) * r * 0.45;
    if (!started) { g.moveTo(ox, oy); started = true; } else { g.lineTo(ox, oy); }
    g.lineTo(ix, iy);
  }
  g.closePath().fill({ color });
}

export function drawCityShape(g: Graphics): void {
  g.clear();
  const r = ENTITY.CITY_RADIUS;
  g.rect(-r, -r * 0.6, r * 2, r * 1.2).fill({ color: COLORS.CITY });
  g.moveTo(-r, -r * 0.6).lineTo(0, -r).lineTo(r, -r * 0.6).closePath().fill({ color: 0xaa7733 });
  g.rect(-r * 0.2, 0, r * 0.4, r * 0.6).fill({ color: 0x553311 });
}

export function drawSupplyShape(g: Graphics): void {
  g.clear();
  const r = ENTITY.SUPPLY_RADIUS;
  g.circle(0, 0, r).fill({ color: COLORS.SUPPLY });
  g.rect(-r * 0.5, -r * 0.5, r, r).fill({ color: 0x775533 });
}