// 責務: シーングラフ構築・毎フレーム描画同期・死亡グレースケール・エフェクト
import { Application, Container, Graphics, Text, ColorMatrixFilter } from 'pixi.js';
import { RENDER, COLORS, TIME } from '../config/constants';
import type { Simulation } from '../sim/Simulation';
import type { Character } from '../domain/types';
import {
  drawRoads, buildCharBody, buildCityIcon, buildVillageIcon, buildFortIcon,
  buildBars, updateBars, makeLabel, drawEffect, buildDungeonIcon, drawLegendAura
} from './Sprites';

interface CharView {
  root: Container;
  body: Container;
  bg: Graphics;
  hp: Graphics;
  mp: Graphics;
  label: Text;
  gray: boolean;
  aura: Graphics;
}

export class Renderer {
  readonly world = new Container();
  private roadG = new Graphics();
  private cityLayer = new Container();
  private villageLayer = new Container();
  private fortLayer = new Container();
  private dungeonLayer = new Container();
  private fortIcons = new Map<number, Container>();
  private charLayer = new Container();
  private fxLayer = new Container();
  private views = new Map<number, CharView>();
  private cityLabels = new Map<number, Text>();
  private grayFilter = new ColorMatrixFilter();

  constructor(private readonly app: Application, private readonly sim: Simulation) {
    this.grayFilter.desaturate();
    this.world.addChild(this.roadG);
    this.world.addChild(this.villageLayer);
    this.world.addChild(this.fortLayer);
    this.world.addChild(this.dungeonLayer);
    this.world.addChild(this.cityLayer);
    this.world.addChild(this.charLayer);
    this.world.addChild(this.fxLayer);
    this.app.stage.addChild(this.world);
    this.buildStatic();
  }

  private buildStatic(): void {
    drawRoads(this.roadG, this.sim.world.roads);
    for (const v of this.sim.world.villages) {
      const icon = buildVillageIcon();
      icon.position.set(v.pos.x, v.pos.y);
      this.villageLayer.addChild(icon);
    }
    for (const c of this.sim.world.cities) {
      const icon = buildCityIcon();
      icon.position.set(c.pos.x, c.pos.y);
      this.cityLayer.addChild(icon);
      const label = makeLabel('');
      label.anchor.set(0.5, 0);
      label.position.set(c.pos.x, c.pos.y + RENDER.CITY_RADIUS + 2);
      this.cityLayer.addChild(label);
      this.cityLabels.set(c.id, label);
    }
    for (const f of this.sim.world.forts) {
      const icon = buildFortIcon();
      icon.position.set(f.pos.x, f.pos.y);
      this.fortLayer.addChild(icon);
      this.fortIcons.set(f.id, icon);
    }
    for (const d of this.sim.dungeons.dungeons) {
      const icon = buildDungeonIcon();
      icon.position.set(d.pos.x, d.pos.y);
      this.dungeonLayer.addChild(icon);
      const label = makeLabel(d.name);
      label.anchor.set(0.5, 0);
      label.position.set(d.pos.x, d.pos.y + RENDER.FORT_RADIUS + 2);
      this.dungeonLayer.addChild(label);
    }
  }

  private ensureView(c: Character): CharView {
    let v = this.views.get(c.id);
    if (v) return v;
    const root = new Container();
    const body = buildCharBody(c);
    const bars = buildBars();
    const label = makeLabel('');
    label.anchor.set(0.5, 0);
    label.position.set(0, (c.kind === 'npc' ? RENDER.NPC_RADIUS : RENDER.MONSTER_RADIUS) + 2);
    const aura = new Graphics();
    root.addChild(aura, body, bars.bg, bars.hp, bars.mp, label);
    this.charLayer.addChild(root);
    v = { root, body, bg: bars.bg, hp: bars.hp, mp: bars.mp, label, gray: false, aura };
    this.views.set(c.id, v);
    return v;
  }

  sync(): void {
    const seen = new Set<number>();
    for (const c of this.sim.chars.values()) {
      seen.add(c.id);
      const v = this.ensureView(c);
      v.root.position.set(c.pos.x, c.pos.y);
      const bob = Math.sin(c.animPhase) * (c.alive ? 1.5 : 0);
      v.body.position.set(0, bob);
      if (c.legendWeaponId >= 0 && c.alive) {
        const r = c.kind === 'npc' ? RENDER.NPC_RADIUS : RENDER.MONSTER_RADIUS;
        drawLegendAura(v.aura, c.animPhase, r);
        v.aura.visible = true;
      } else {
        v.aura.visible = false;
      }
      updateBars(v.hp, v.mp, v.bg, c);
      const stamp = `${c.stats.health < 60 ? '弱' : ''}HP${Math.floor(c.stats.hp)}`;
      v.label.text = c.kind === 'npc'
        ? `(${c.title})${c.surname}・${c.givenName} ${stamp}`
        : `${c.title} ${stamp}`;
      if (!c.alive && !v.gray) {
        v.root.filters = [this.grayFilter];
        v.gray = true;
      } else if (c.alive && v.gray) {
        v.root.filters = [];
        v.gray = false;
      }
    }
    for (const [id, v] of this.views) {
      if (!seen.has(id)) {
        v.root.destroy({ children: true });
        this.views.delete(id);
      }
    }
    for (const c of this.sim.world.cities) {
      const label = this.cityLabels.get(c.id);
      if (label) {
        const stay = this.sim.cityStayCount(c.id);
        label.text = `${c.name} 滞在${stay} 人口${c.population}`;
      }
    }
    for (const f of this.sim.world.forts) {
      const icon = this.fortIcons.get(f.id);
      if (icon) icon.visible = f.alive;
      else if (f.alive) {
        const fresh = buildFortIcon();
        fresh.position.set(f.pos.x, f.pos.y);
        this.fortLayer.addChild(fresh);
        this.fortIcons.set(f.id, fresh);
      }
    }
    this.syncEffects();
  }

  private fxPool: Graphics[] = [];
  private syncEffects(): void {
    const effects = this.sim.effects;
    while (this.fxPool.length < effects.length) {
      const g = new Graphics();
      this.fxLayer.addChild(g);
      this.fxPool.push(g);
    }
    for (let i = 0; i < this.fxPool.length; i++) {
      const g = this.fxPool[i];
      if (i < effects.length) {
        const e = effects[i];
        g.visible = true;
        g.position.set(e.x, e.y);
        drawEffect(g, e.type, e.t);
      } else {
        g.visible = false;
      }
    }
  }

  hitTestChar(wx: number, wy: number): number | null {
    let best: number | null = null;
    let bestD = Infinity;
    for (const c of this.sim.chars.values()) {
      const r = (c.kind === 'npc' ? RENDER.NPC_RADIUS : RENDER.MONSTER_RADIUS) + 6;
      const dx = c.pos.x - wx;
      const dy = c.pos.y - wy;
      const d = dx * dx + dy * dy;
      if (d < r * r && d < bestD) {
        bestD = d;
        best = c.id;
      }
    }
    return best;
  }

  hitTestCity(wx: number, wy: number): number | null {
    for (const c of this.sim.world.cities) {
      const dx = c.pos.x - wx;
      const dy = c.pos.y - wy;
      if (dx * dx + dy * dy < RENDER.CITY_RADIUS * RENDER.CITY_RADIUS) return c.id;
    }
    return null;
  }

  get deadHoldSeconds(): number {
    return RENDER.DEAD_GRAYSCALE_SECONDS * TIME.GAME_MINUTES_PER_SECOND;
  }

  get groundColor(): number {
    return COLORS.GROUND;
  }
}