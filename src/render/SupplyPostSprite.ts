// 責務: 補給拠点アイコン+名称ラベルの表示。

import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { COLORS, WORLD } from '../config/GameConfig';
import { SupplyPost } from '../domain/SupplyPost';
import { drawSupplyIcon } from './ProceduralTextures';

const ICON_SIZE = WORLD.TILE_SIZE * 1.2;

export class SupplyPostSprite {
  readonly container: Container = new Container();

  constructor(post: SupplyPost, externalTexture: Texture | null) {
    if (externalTexture) {
      const sp = new Sprite(externalTexture);
      sp.anchor.set(0.5);
      sp.width = ICON_SIZE;
      sp.height = ICON_SIZE;
      this.container.addChild(sp);
    } else {
      const g = new Graphics();
      drawSupplyIcon(g, COLORS.SUPPLY, ICON_SIZE);
      this.container.addChild(g);
    }

    const style = new TextStyle({
      fontSize: 8,
      fill: COLORS.SUPPLY,
      align: 'center',
    });
    const label = new Text({ text: post.name, style });
    label.anchor.set(0.5, 0);
    label.position.set(0, ICON_SIZE * 0.55);
    this.container.addChild(label);

    this.container.position.set(post.x, post.y);
  }
}