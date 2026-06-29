// 責務: 砦アイコンの表示。消滅時に除去できるよう参照を保持。

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { COLORS, WORLD } from '../config/GameConfig';
import { Fort } from '../domain/Fort';
import { drawFortIcon } from './ProceduralTextures';

const ICON_SIZE = WORLD.TILE_SIZE * 1.6;

export class FortSprite {
  readonly container: Container = new Container();
  readonly fort: Fort;

  constructor(fort: Fort, externalTexture: Texture | null) {
    this.fort = fort;
    if (externalTexture) {
      const sp = new Sprite(externalTexture);
      sp.anchor.set(0.5);
      sp.width = ICON_SIZE;
      sp.height = ICON_SIZE;
      this.container.addChild(sp);
    } else {
      const g = new Graphics();
      drawFortIcon(g, COLORS.FORT, ICON_SIZE);
      this.container.addChild(g);
    }
    this.container.position.set(fort.x, fort.y);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}