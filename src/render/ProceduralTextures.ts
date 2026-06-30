// 責務: キャラ/都市/村/ボスのプロシージャル形状描画ヘルパ（Graphics生成）
import { Graphics } from 'pixi.js';
import { RENDER } from '../config/constants';
import type { Character, WeaponKind } from '../domain/types';

const WEAPON_COLOR: Record<WeaponKind, number> = {
  sword: 0xc0c0d0,
  pole: 0xb08040,
  bow: 0x80c060,
  magic: 0xc060ff,
};

export function drawNpcIcon(g: Graphics, c: Character): void {
  const r = RENDER.ICON_RADIUS;
  const bodyColor = c.kind === 'bandit' ? 0x804040 : c.sex === 'male' ? 0x4060a0 : 0xa04080;
  g.circle(0, -r * 0.3, r * 0.5).fill({ color: bodyColor });
  g.roundRect(-r * 0.5, -r * 0.1, r, r, 3).fill({ color: bodyColor });
  drawWeaponMark(g, c.inventory.weapon, r);
}

function drawWeaponMark(g: Graphics, weapon: WeaponKind, r: number): void {
  const color = WEAPON_COLOR[weapon];
  switch (weapon) {
    case 'sword':
      g.rect(r * 0.4, -r * 0.6, 3, r).fill({ color });
      break;
    case 'pole':
      g.rect(r * 0.5, -r * 0.8, 2, r * 1.4).fill({ color });
      break;
    case 'bow':
      g.circle(r * 0.6, 0, r * 0.4).stroke({ color, width: 2 });
      break;
    case 'magic':
      g.star(r * 0.6, -r * 0.4, 4, r * 0.3).fill({ color });
      break;
  }
}

export function drawMonsterIcon(g: Graphics, c: Character): void {
  const r = RENDER.ICON_RADIUS;
  const strength = (c.stats.power + c.stats.magic) / 200;
  const base = 0x80 - Math.floor(strength * 0x60);
  const color = (base << 16) | (Math.floor(base * 0.6) << 8) | Math.floor(base * 0.7);
  const spikes = 6;
  g.star(0, 0, spikes, r, r * 0.5).fill({ color });
}

export function drawBossIcon(g: Graphics): void {
  const r = RENDER.BOSS_RADIUS;
  g.star(0, 0, 8, r, r * 0.5).fill({ color: 0x300018 });
  g.star(0, 0, 8, r * 0.6, r * 0.3).fill({ color: 0xa00040 });
}

export function drawCityIcon(g: Graphics): void {
  const r = RENDER.CITY_RADIUS;
  g.roundRect(-r, -r * 0.6, r * 2, r * 1.2, 4).fill({ color: 0x8a7a50 });
  g.rect(-r * 0.8, -r * 0.6, r * 0.4, r * 0.6).fill({ color: 0x60502f });
  g.rect(r * 0.4, -r * 0.6, r * 0.4, r * 0.6).fill({ color: 0x60502f });
}

export function drawVillageIcon(g: Graphics): void {
  const r = RENDER.VILLAGE_RADIUS;
  g.poly([0, -r, r, r * 0.6, -r, r * 0.6]).fill({ color: 0x6f5a3a });
}

export function drawDungeonIcon(g: Graphics): void {
  const r = RENDER.DUNGEON_RADIUS;
  g.circle(0, 0, r).fill({ color: 0x202028 });
  g.circle(0, 0, r * 0.5).fill({ color: 0x000000 });
}

export function drawFortIcon(g: Graphics): void {
  const r = RENDER.CITY_RADIUS * 0.8;
  g.rect(-r, -r, r * 2, r * 2).fill({ color: 0x402020 });
  g.rect(-r, -r, r * 0.4, r * 0.4).fill({ color: 0x201010 });
  g.rect(r * 0.6, -r, r * 0.4, r * 0.4).fill({ color: 0x201010 });
}