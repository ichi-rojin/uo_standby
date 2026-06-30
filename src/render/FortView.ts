// File: src/render/FortView.ts
// 責務: 砦1件のプロシージャル描画。荒々しい多角形の拠点を表現する。

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Fort } from '../entities/Fort';
import { ColorConfig } from '../config/GameConfig';

const FORT_RADIUS = 24;

export class FortView {
  public readonly container: Container;
  private readonly label: Text;

  constructor(public readonly fort: Fort) {
    this.container = new Container();
    const body = new Graphics();
    body
      .moveTo(-FORT_RADIUS, FORT_RADIUS * 0.6)
      .lineTo(-FORT_RADIUS, -FORT_RADIUS * 0.2)
      .lineTo(-FORT_RADIUS * 0.6, -FORT_RADIUS * 0.6)
      .lineTo(FORT_RADIUS * 0.6, -FORT_RADIUS * 0.6)
      .lineTo(FORT_RADIUS, -FORT_RADIUS * 0.2)
      .lineTo(FORT_RADIUS, FORT_RADIUS * 0.6)
      .closePath()
      .fill({ color: 0x4a3a3a })
      .stroke({ width: 2, color: ColorConfig.NPC_EVIL });
    const style = new TextStyle({
      fontSize: 10,
      fill: ColorConfig.NPC_EVIL,
      stroke: { color: 0x000000, width: 2 },
    });
    this.label = new Text({ text: '砦', style });
    this.label.anchor.set(0.5, 0);
    this.label.y = FORT_RADIUS * 0.7;
    this.container.addChild(body);
    this.container.addChild(this.label);
    this.container.x = fort.x;
    this.container.y = fort.y;
  }

  public refresh(): void {
    this.label.text = `砦(${this.fort.memberIds.size})`;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}