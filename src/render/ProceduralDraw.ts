// File: src/render/ProceduralDraw.ts
// 責務: PixiJS Graphicsによるキャラ・都市・補給拠点・武器アイコンのプロシージャル描画。

import { Graphics } from 'pixi.js';
import { WeaponType } from '../domain/types';
import { RenderConfig, ColorConfig } from '../config/GameConfig';

export function drawNpcBody(g: Graphics, baseColor: number): void {
  const r = RenderConfig.CHAR_RADIUS;
  g.circle(0, -r * 0.4, r * 0.5).fill({ color: baseColor });
  g.roundRect(-r * 0.45, -r * 0.1, r * 0.9, r * 1.1, 3).fill({ color: baseColor });
}

export function drawWeaponIcon(g: Graphics, weapon: WeaponType): void {
  const r = RenderConfig.CHAR_RADIUS;
  const metal = 0xd8d8e0;
  switch (weapon) {
    case WeaponType.Sword:
      g.moveTo(r * 0.6, -r).lineTo(r * 0.6, r * 0.6).stroke({ width: 2, color: metal });
      g.moveTo(r * 0.2, r * 0.1).lineTo(r, r * 0.1).stroke({ width: 2, color: 0x8a6a30 });
      break;
    case WeaponType.Polearm:
      g.moveTo(r * 0.7, -r * 1.2).lineTo(r * 0.7, r).stroke({ width: 2, color: 0x8a6a30 });
      g.moveTo(r * 0.7, -r * 1.2)
        .lineTo(r * 1.0, -r * 0.8)
        .lineTo(r * 0.4, -r * 0.8)
        .lineTo(r * 0.7, -r * 1.2)
        .fill({ color: metal });
      break;
    case WeaponType.Bow:
      g.arc(r * 0.6, 0, r * 0.9, -Math.PI / 2.2, Math.PI / 2.2).stroke({
        width: 2,
        color: 0x8a6a30,
      });
      g.moveTo(r * 0.6, -r * 0.7).lineTo(r * 0.6, r * 0.7).stroke({ width: 1, color: metal });
      break;
  }
}

export function drawMonsterBody(g: Graphics, tint: number): void {
  const r = RenderConfig.CHAR_RADIUS;
  const spikes = 8;
  g.moveTo(r, 0);
  for (let i = 0; i < spikes; i++) {
    const a1 = ((i + 0.5) / spikes) * Math.PI * 2;
    const a2 = ((i + 1) / spikes) * Math.PI * 2;
    g.lineTo(Math.cos(a1) * r * 0.5, Math.sin(a1) * r * 0.5);
    g.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
  }
  g.closePath().fill({ color: tint });
  g.circle(0, 0, r * 0.25).fill({ color: 0xffe060 });
}

export function drawBossBody(g: Graphics, tint: number): void {
  const r = RenderConfig.CHAR_RADIUS * 2.2;
  const spikes = 12;
  g.moveTo(r, 0);
  for (let i = 0; i < spikes; i++) {
    const a1 = ((i + 0.5) / spikes) * Math.PI * 2;
    const a2 = ((i + 1) / spikes) * Math.PI * 2;
    g.lineTo(Math.cos(a1) * r * 0.55, Math.sin(a1) * r * 0.55);
    g.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
  }
  g.closePath().fill({ color: tint });
  g.circle(0, 0, r * 0.3).fill({ color: 0xff3030 });
}

export function drawCityBody(g: Graphics): void {
  const r = RenderConfig.CITY_RADIUS;
  g.roundRect(-r, -r * 0.6, r * 2, r * 1.6, 4).fill({ color: ColorConfig.CITY_FILL });
  g.roundRect(-r, -r * 0.6, r * 2, r * 1.6, 4).stroke({
    width: 2,
    color: ColorConfig.CITY_BORDER,
  });
  g.moveTo(-r, -r * 0.6)
    .lineTo(0, -r * 1.2)
    .lineTo(r, -r * 0.6)
    .fill({ color: ColorConfig.CITY_BORDER });
}

export function drawSupplyBody(g: Graphics): void {
  const r = RenderConfig.SUPPLY_RADIUS;
  g.roundRect(-r * 0.8, -r * 0.5, r * 1.6, r * 1.1, 2).fill({ color: ColorConfig.SUPPLY_FILL });
  g.roundRect(-r * 0.8, -r * 0.5, r * 1.6, r * 1.1, 2).stroke({
    width: 1.5,
    color: ColorConfig.SUPPLY_BORDER,
  });
}

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}