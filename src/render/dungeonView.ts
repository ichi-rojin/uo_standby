// 責務: ダンジョン入口のプロシージャル描画
import { Container, Graphics, Text } from 'pixi.js';
import { DUNGEON } from '../config/constants2';
import type { Dungeon } from '../entities/dungeon';

export class DungeonView {
  container: Container;
  private label: Text;

  constructor(d: Dungeon) {
    this.container = new Container();
    const g = new Graphics();
    const r = DUNGEON.RADIUS;
    g.circle(0, 0, r).fill({ color: DUNGEON.COLOR });
    g.circle(0, 0, r * 0.5).fill({ color: 0x110011 });
    this.label = new Text({ text: d.name, style: { fill: 0xcc99ff, fontSize: 10 } });
    this.label.anchor.set(0.5, 0);
    this.label.y = r;
    this.container.addChild(g, this.label);
    this.container.x = d.pos.x;
    this.container.y = d.pos.y;
  }

  update(d: Dungeon): void {
    this.label.text = d.cleared ? `${d.name}(踏破)` : d.name;
  }
}