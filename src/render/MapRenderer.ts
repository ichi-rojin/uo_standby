// src/render/MapRenderer.ts
// 責務: 背景マップチップと道路網（薄いグレー）を静的に一度だけ描画する。

import { Container, Graphics } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import { WORLD } from '../config/constants';

const TILE_SIZE = 500;
const GROUND_COLOR_A = 0x18221a;
const GROUND_COLOR_B = 0x1c2620;
const ROAD_COLOR = 0x9aa0a8;
const ROAD_ALPHA = 0.35;
const ROAD_WIDTH = 14;

export class MapRenderer {
  readonly container: Container;

  constructor(world: WorldState) {
    this.container = new Container();
    this.drawGround();
    this.drawRoads(world);
  }

  private drawGround(): void {
    const g = new Graphics();
    const cols = Math.ceil(WORLD.WIDTH / TILE_SIZE);
    const rows = Math.ceil(WORLD.HEIGHT / TILE_SIZE);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const color = (r + c) % 2 === 0 ? GROUND_COLOR_A : GROUND_COLOR_B;
        g.rect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE).fill({ color });
      }
    }
    this.container.addChild(g);
  }

  private drawRoads(world: WorldState): void {
    const g = new Graphics();
    for (const seg of world.roads) {
      g.moveTo(seg.from.x, seg.from.y).lineTo(seg.to.x, seg.to.y);
    }
    g.stroke({ color: ROAD_COLOR, width: ROAD_WIDTH, alpha: ROAD_ALPHA });
    this.container.addChild(g);
  }
}