// 責務: 道路網(薄いグレー)を描画する静的レイヤ。

import { Container, Graphics } from 'pixi.js';
import { COLORS, WORLD } from '../config/GameConfig';
import { RoadNetwork } from '../world/RoadNetwork';

export class RoadRenderer {
  readonly container: Container = new Container();

  render(roads: RoadNetwork): void {
    this.container.removeChildren();
    const g = new Graphics();
    const width = Math.max(2, WORLD.TILE_SIZE * 0.25);
    for (const e of roads.edges) {
      g.moveTo(e.ax, e.ay).lineTo(e.bx, e.by);
    }
    g.stroke({ width, color: COLORS.ROAD, alpha: 0.5 });
    this.container.addChild(g);
  }
}