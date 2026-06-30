// 責務: バイオーム地表・道路・都市・村・ダンジョン・砦の静的/準静的描画
import { Container, Graphics, Text } from 'pixi.js';
import { COUNTS, WORLD } from '../config/constants';
import { BIOME_COLORS } from '../world/biome';
import {
  drawCityIcon,
  drawVillageIcon,
  drawDungeonIcon,
  drawFortIcon,
} from './proceduralTextures';
import type { GameState } from '../state/gameState';

const ROAD_COLOR = 0xb0b0b0;
const ROAD_ALPHA = 0.35;

export class MapRenderer {
  readonly container = new Container();
  private readonly ground = new Graphics();
  private readonly roadGfx = new Graphics();
  private readonly staticIcons = new Container();
  private readonly fortLayer = new Container();
  private readonly cityLabels: Text[] = [];

  constructor() {
    this.container.addChild(this.ground);
    this.container.addChild(this.roadGfx);
    this.container.addChild(this.staticIcons);
    this.container.addChild(this.fortLayer);
  }

  buildStatic(state: GameState): void {
    this.drawGround();
    this.drawRoads(state);
    this.drawStaticIcons(state);
  }

  private drawGround(): void {
    const cols = Math.ceil(Math.sqrt(COUNTS.BIOMES));
    const cellW = WORLD.WIDTH / cols;
    const cellH = WORLD.HEIGHT / cols;
    for (let cy = 0; cy < cols; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const idx = (cy * cols + cx) % COUNTS.BIOMES;
        this.ground
          .rect(cx * cellW, cy * cellH, cellW, cellH)
          .fill({ color: BIOME_COLORS[idx] });
      }
    }
  }

  private drawRoads(state: GameState): void {
    this.roadGfx.clear();
    for (const r of state.roads) {
      this.roadGfx
        .moveTo(r.ax, r.ay)
        .lineTo(r.bx, r.by)
        .stroke({ color: ROAD_COLOR, width: 6, alpha: ROAD_ALPHA });
    }
  }

  private drawStaticIcons(state: GameState): void {
    this.staticIcons.removeChildren();
    this.cityLabels.length = 0;

    for (const d of state.dungeons) {
      const g = new Graphics();
      drawDungeonIcon(g);
      g.position.set(d.x, d.y);
      this.staticIcons.addChild(g);
    }
    for (const v of state.villages) {
      const g = new Graphics();
      drawVillageIcon(g);
      g.position.set(v.x, v.y);
      this.staticIcons.addChild(g);
    }
    for (const city of state.cities) {
      const g = new Graphics();
      drawCityIcon(g);
      g.position.set(city.x, city.y);
      this.staticIcons.addChild(g);
      const label = new Text({
        text: '',
        style: { fontSize: 12, fill: 0xffffff, align: 'center' },
      });
      label.anchor.set(0.5, 0);
      label.position.set(city.x, city.y + 28);
      this.staticIcons.addChild(label);
      this.cityLabels.push(label);
    }
  }

  updateDynamic(state: GameState): void {
    for (let i = 0; i < state.cities.length; i++) {
      const city = state.cities[i];
      const label = this.cityLabels[i];
      if (!label) continue;
      const npcCount = city.residents.length;
      label.text = `${city.name} NPC:${npcCount} 人口:${city.population}`;
    }
    this.fortLayer.removeChildren();
    for (const fort of state.forts) {
      if (!fort.alive) continue;
      const g = new Graphics();
      drawFortIcon(g);
      g.position.set(fort.x, fort.y);
      this.fortLayer.addChild(g);
    }
  }
}