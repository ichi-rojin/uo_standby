// 責務: プロシージャル描画(マップ・キャラ・敵・エフェクト)と外部画像差し替え
import { Graphics, Container, Text, Sprite, Assets, Texture } from 'pixi.js';
import { COLORS, RENDER, ASSETS, DUNGEON_COLORS } from '../config/constants';
import type { Character, City, Village, Road, WeaponKind } from '../domain/types';
import { monsterColor } from '../domain/Factory';

const externalTextures: Partial<Record<string, Texture>> = {};

export async function preloadExternal(): Promise<void> {
  if (!ASSETS.USE_EXTERNAL) return;
  const entries: [string, string][] = [
    ['npc', ASSETS.NPC],
    ['monster', ASSETS.MONSTER],
    ['city', ASSETS.CITY],
    ['village', ASSETS.VILLAGE],
    ['fort', ASSETS.FORT]
  ];
  for (const [k, url] of entries) {
    if (url) externalTextures[k] = await Assets.load<Texture>(url);
  }
}

export function drawRoads(g: Graphics, roads: readonly Road[]): void {
  g.clear();
  for (const r of roads) {
    g.moveTo(r.a.x, r.a.y).lineTo(r.b.x, r.b.y);
  }
  g.stroke({ width: 6, color: COLORS.ROAD, alpha: 0.6 });
}

function weaponMark(g: Graphics, weapon: WeaponKind, r: number): void {
  g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.9 });
  switch (weapon) {
    case 'sword':
      g.moveTo(0, -r).lineTo(0, r).stroke();
      break;
    case 'pole':
      g.moveTo(-r * 0.6, -r).lineTo(r * 0.6, r).stroke();
      break;
    case 'bow':
      g.arc(0, 0, r * 0.8, -Math.PI / 2, Math.PI / 2).stroke();
      break;
    case 'magic':
      g.star(0, 0, 5, r * 0.7, r * 0.3).stroke();
      break;
  }
}

export function buildCharBody(c: Character): Container {
  const cont = new Container();
  const r = c.kind === 'npc' ? RENDER.NPC_RADIUS : RENDER.MONSTER_RADIUS;

  if (ASSETS.USE_EXTERNAL) {
    const tex = c.kind === 'npc' ? externalTextures['npc'] : externalTextures['monster'];
    if (tex) {
      const sp = new Sprite(tex);
      sp.anchor.set(0.5);
      sp.width = r * 2;
      sp.height = r * 2;
      cont.addChild(sp);
      return cont;
    }
  }

  const g = new Graphics();
  if (c.kind === 'npc') {
    const color = c.evil ? COLORS.NPC_EVIL : COLORS.NPC_GOOD;
    g.circle(0, -r * 0.4, r * 0.5).fill(color); // 頭
    g.roundRect(-r * 0.5, 0, r, r, 2).fill(color); // 胴
    weaponMark(g, c.inventory.weapon, r);
  } else {
    const color = c.kind === 'boss' ? 0x220022 : monsterColor(c.monsterDarkness);
    g.star(0, 0, 8, r, r * 0.45).fill(color); // トゲトゲ
    g.circle(-r * 0.25, -r * 0.2, 1.5).fill(0xff3333);
    g.circle(r * 0.25, -r * 0.2, 1.5).fill(0xff3333);
  }
  cont.addChild(g);
  return cont;
}

export function buildCityIcon(): Container {
  const cont = new Container();
  if (ASSETS.USE_EXTERNAL && externalTextures['city']) {
    const sp = new Sprite(externalTextures['city']);
    sp.anchor.set(0.5);
    sp.width = RENDER.CITY_RADIUS * 2;
    sp.height = RENDER.CITY_RADIUS * 2;
    cont.addChild(sp);
    return cont;
  }
  const g = new Graphics();
  g.rect(-RENDER.CITY_RADIUS, -RENDER.CITY_RADIUS, RENDER.CITY_RADIUS * 2, RENDER.CITY_RADIUS * 2).fill(COLORS.CITY);
  g.rect(-RENDER.CITY_RADIUS, -RENDER.CITY_RADIUS - 8, RENDER.CITY_RADIUS * 2, 8).fill(0x886622);
  cont.addChild(g);
  return cont;
}

export function buildVillageIcon(): Container {
  const cont = new Container();
  if (ASSETS.USE_EXTERNAL && externalTextures['village']) {
    const sp = new Sprite(externalTextures['village']);
    sp.anchor.set(0.5);
    sp.width = RENDER.VILLAGE_RADIUS * 2;
    sp.height = RENDER.VILLAGE_RADIUS * 2;
    cont.addChild(sp);
    return cont;
  }
  const g = new Graphics();
  g.poly([0, -RENDER.VILLAGE_RADIUS, RENDER.VILLAGE_RADIUS, RENDER.VILLAGE_RADIUS, -RENDER.VILLAGE_RADIUS, RENDER.VILLAGE_RADIUS]).fill(COLORS.VILLAGE);
  cont.addChild(g);
  return cont;
}

export function buildFortIcon(): Container {
  const cont = new Container();
  if (ASSETS.USE_EXTERNAL && externalTextures['fort']) {
    const sp = new Sprite(externalTextures['fort']);
    sp.anchor.set(0.5);
    sp.width = RENDER.FORT_RADIUS * 2;
    sp.height = RENDER.FORT_RADIUS * 2;
    cont.addChild(sp);
    return cont;
  }
  const g = new Graphics();
  g.rect(-RENDER.FORT_RADIUS, -RENDER.FORT_RADIUS, RENDER.FORT_RADIUS * 2, RENDER.FORT_RADIUS * 2).fill(COLORS.FORT);
  cont.addChild(g);
  return cont;
}

export function buildBars(): { bg: Graphics; hp: Graphics; mp: Graphics } {
  return { bg: new Graphics(), hp: new Graphics(), mp: new Graphics() };
}

export function updateBars(
  hp: Graphics,
  mp: Graphics,
  bg: Graphics,
  c: Character
): void {
  const w = RENDER.BAR_WIDTH;
  const h = RENDER.BAR_HEIGHT;
  const yTop = -(c.kind === 'npc' ? RENDER.NPC_RADIUS : RENDER.MONSTER_RADIUS) - 12;
  bg.clear();
  bg.rect(-w / 2, yTop, w, h).fill(COLORS.HP_BG);
  bg.rect(-w / 2, yTop + h + 1, w, h).fill(COLORS.MP_BG);
  hp.clear();
  hp.rect(-w / 2, yTop, w * Math.max(0, c.stats.hp / c.stats.maxHp), h).fill(COLORS.HP);
  mp.clear();
  mp.rect(-w / 2, yTop + h + 1, w * Math.max(0, c.stats.mp / Math.max(1, c.stats.maxMp)), h).fill(COLORS.MP);
}

export function makeLabel(text: string): Text {
  return new Text({
    text,
    style: { fontFamily: 'monospace', fontSize: 9, fill: COLORS.TEXT, align: 'center' }
  });
}

export function drawEffect(g: Graphics, type: 'damage' | 'heal' | 'buff' | 'debuff', t: number): void {
  g.clear();
  const alpha = 1 - t / 0.8;
  const radius = 6 + t * 30;
  let color = COLORS.DAMAGE;
  if (type === 'heal') color = COLORS.HEAL;
  else if (type === 'buff') color = COLORS.BUFF;
  else if (type === 'debuff') color = COLORS.DEBUFF;
  g.circle(0, 0, radius).stroke({ width: 2, color, alpha });
}

export function buildDungeonIcon(): Container {
  const cont = new Container();
  const g = new Graphics();
  g.poly([0, -RENDER.FORT_RADIUS, RENDER.FORT_RADIUS, 0, 0, RENDER.FORT_RADIUS, -RENDER.FORT_RADIUS, 0])
    .fill(DUNGEON_COLORS.ENTRANCE);
  g.circle(0, 0, RENDER.FORT_RADIUS * 0.4).fill(0x000000);
  cont.addChild(g);
  return cont;
}

export function drawLegendAura(g: Graphics, phase: number, r: number): void {
  g.clear();
  const pulse = 0.5 + 0.5 * Math.sin(phase);
  g.circle(0, 0, r + 4 + pulse * 3).stroke({ width: 2, color: DUNGEON_COLORS.LEGEND_GLOW, alpha: 0.4 + pulse * 0.4 });
}
