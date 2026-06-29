// 責務: 地形タイルを1枚のGraphics(またはタイル画像)に描画する。静的レイヤ。

import { Container, Graphics, Sprite } from 'pixi.js';
import { WORLD } from '../config/GameConfig';
import { TerrainType, terrainColor } from '../world/WorldGenerator';
import { AssetResolver } from './AssetResolver';
import { ASSET_CONFIG } from './AssetResolver';

export class TerrainRenderer {
  readonly container: Container = new Container();

  render(terrain: TerrainType[], assets: AssetResolver): void {
    this.container.removeChildren();
    const w = WORLD.WIDTH_TILES;
    const h = WORLD.HEIGHT_TILES;
    const ts = WORLD.TILE_SIZE;

    const useImages =
      assets.get(ASSET_CONFIG.terrainGrass) !== null ||
      assets.get(ASSET_CONFIG.terrainWater) !== null;

    if (useImages) {
      this.renderWithImages(terrain, assets, w, h, ts);
    } else {
      this.renderProcedural(terrain, w, h, ts);
    }
  }

  private renderProcedural(
    terrain: TerrainType[],
    w: number,
    h: number,
    ts: number
  ): void {
    const g = new Graphics();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = terrain[y * w + x];
        const alt = (x + y) % 2 === 0;
        g.rect(x * ts, y * ts, ts, ts).fill({ color: terrainColor(t, alt) });
      }
    }
    this.container.addChild(g);
  }

  private renderWithImages(
    terrain: TerrainType[],
    assets: AssetResolver,
    w: number,
    h: number,
    ts: number
  ): void {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = terrain[y * w + x];
        const tex = this.pickTexturePath(t, assets);
        if (tex) {
          const sp = new Sprite(tex);
          sp.width = ts;
          sp.height = ts;
          sp.position.set(x * ts, y * ts);
          this.container.addChild(sp);
        }
      }
    }
  }

  private pickTexturePath(t: TerrainType, assets: AssetResolver) {
    switch (t) {
      case 'water':
        return assets.get(ASSET_CONFIG.terrainWater);
      case 'sand':
        return assets.get(ASSET_CONFIG.terrainSand);
      case 'mountain':
        return assets.get(ASSET_CONFIG.terrainMountain);
      case 'grass':
      default:
        return assets.get(ASSET_CONFIG.terrainGrass);
    }
  }
}