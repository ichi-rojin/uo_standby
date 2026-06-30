// 責務: 都市/補給拠点の表示とラベル
import { Container, Graphics, Text } from 'pixi.js';
import { drawCityShape, drawSupplyShape } from './proceduralTextures';
import type { Place } from '../entities/place';

export class PlaceView {
  container: Container;
  private label: Text;

  constructor(p: Place) {
    this.container = new Container();
    const g = new Graphics();
    if (p.kind === 'city') drawCityShape(g);
    else drawSupplyShape(g);
    this.label = new Text({
      text: '',
      style: { fill: 0xffffaa, fontSize: 11, fontWeight: 'bold' }
    });
    this.label.anchor.set(0.5, 0);
    this.label.y = 18;
    this.container.addChild(g, this.label);
    this.container.x = p.pos.x;
    this.container.y = p.pos.y;
    this.update(p);
  }

  update(p: Place): void {
    this.label.text = `${p.name} 滞在${p.presentNpcIds.size} 人口${p.population}`;
  }
}