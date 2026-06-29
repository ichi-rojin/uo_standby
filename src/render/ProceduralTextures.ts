// 責務: PixiJS Graphics によるプロシージャル図形描画ヘルパ。
// マップチップ・キャラチップ・敵・拠点アイコンの形状生成を集約。

import { Graphics } from 'pixi.js';
import { WeaponType } from '../domain/types';

/** 人型ボディ(NPC)をGraphicsに描画 */
export function drawHumanoid(
  g: Graphics,
  bodyColor: number,
  weapon: WeaponType,
  size: number
): void {
  g.clear();
  const r = size * 0.5;
  // 胴
  g.circle(0, 0, r * 0.7).fill({ color: bodyColor });
  // 頭
  g.circle(0, -r * 0.7, r * 0.4).fill({ color: 0xf0d8b0 });
  // 武器アイコン(右側)
  drawWeaponMark(g, weapon, r);
}

function drawWeaponMark(g: Graphics, weapon: WeaponType, r: number): void {
  const wx = r * 0.9;
  switch (weapon) {
    case 'sword':
      g.rect(wx - 1, -r, 2, r * 1.6).fill({ color: 0xdddddd });
      g.rect(wx - 4, -r * 0.2, 8, 2).fill({ color: 0x999999 });
      break;
    case 'polearm':
      g.rect(wx - 1, -r * 1.2, 2, r * 2.2).fill({ color: 0xc0a070 });
      g.moveTo(wx, -r * 1.2)
        .lineTo(wx - 4, -r * 0.8)
        .lineTo(wx + 4, -r * 0.8)
        .closePath()
        .fill({ color: 0xdddddd });
      break;
    case 'bow':
      g.arc(wx, 0, r * 0.9, -Math.PI / 2, Math.PI / 2).stroke({
        width: 2,
        color: 0x9b6b3a,
      });
      g.moveTo(wx, -r * 0.9)
        .lineTo(wx, r * 0.9)
        .stroke({ width: 1, color: 0xeeeeee });
      break;
    case 'none':
    default:
      break;
  }
}

/** モンスター(トゲトゲ)をGraphicsに描画。color/strength で個体差。 */
export function drawMonster(
  g: Graphics,
  bodyColor: number,
  spikes: number,
  size: number
): void {
  g.clear();
  const rOuter = size * 0.55;
  const rInner = size * 0.32;
  const points: number[] = [];
  const total = spikes * 2;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? rOuter : rInner;
    points.push(Math.cos(angle) * rad, Math.sin(angle) * rad);
  }
  g.poly(points).fill({ color: bodyColor });
  g.circle(0, 0, rInner * 0.5).fill({ color: 0x000000, alpha: 0.4 });
}

/** 都市アイコン(城/塔)を描画 */
export function drawCityIcon(g: Graphics, color: number, size: number): void {
  g.clear();
  const half = size * 0.5;
  g.rect(-half, -half * 0.3, size, half * 1.3).fill({ color });
  // 凸凹の城壁
  const merlon = size / 6;
  for (let i = 0; i < 3; i++) {
    g.rect(-half + i * merlon * 2, -half * 0.6, merlon, half * 0.3).fill({
      color,
    });
  }
  g.rect(-merlon * 0.5, half * 0.4, merlon, half * 0.6).fill({
    color: 0x442200,
  });
}

/** 補給拠点アイコン(小屋)を描画 */
export function drawSupplyIcon(g: Graphics, color: number, size: number): void {
  g.clear();
  const half = size * 0.5;
  g.rect(-half * 0.7, 0, size * 0.7, half).fill({ color });
  g.moveTo(-half * 0.8, 0)
    .lineTo(0, -half * 0.7)
    .lineTo(half * 0.8, 0)
    .closePath()
    .fill({ color: 0x6b4423 });
}

/** 砦アイコンを描画 */
export function drawFortIcon(g: Graphics, color: number, size: number): void {
  g.clear();
  const half = size * 0.5;
  g.rect(-half, -half * 0.5, size, size).fill({ color });
  g.rect(-half, -half * 0.8, half * 0.4, half * 0.4).fill({ color });
  g.rect(half * 0.6, -half * 0.8, half * 0.4, half * 0.4).fill({ color });
}