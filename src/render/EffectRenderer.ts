// 責務: ダメージ/回復/バフ/魔法エフェクトのプロシージャル描画
import { Container, Graphics, Text } from 'pixi.js';
import { RENDER } from '../config/constants';
import type { Effect } from '../domain/types';

const EFFECT_COLOR = {
  damage: 0xff3030,
  heal: 0x30ff60,
  buff: 0x60a0ff,
  debuff: 0xa030ff,
  magic: 0xffd040,
} as const;

export class EffectRenderer {
  readonly container = new Container();
  private readonly gfx = new Graphics();
  private readonly labels: Text[] = [];

  constructor() {
    this.container.addChild(this.gfx);
  }

  render(effects: Effect[]): void {
    this.gfx.clear();
    for (const t of this.labels) t.visible = false;
    let labelIndex = 0;

    for (const e of effects) {
      const t = 1 - e.ttl / RENDER.EFFECT_LIFETIME;
      const radius = 6 + t * 24;
      const alpha = 1 - t;
      const color = EFFECT_COLOR[e.kind];
      this.gfx.circle(e.x, e.y, radius).stroke({ color, width: 3, alpha });

      if (e.kind === 'damage' || e.kind === 'heal') {
        const label = this.acquireLabel(labelIndex++);
        label.text = `${e.kind === 'heal' ? '+' : '-'}${e.value}`;
        label.style.fill = color;
        label.x = e.x;
        label.y = e.y - 20 - t * 16;
        label.alpha = alpha;
        label.visible = true;
      }
    }
  }

  private acquireLabel(index: number): Text {
    if (index < this.labels.length) return this.labels[index];
    const t = new Text({ text: '', style: { fontSize: 12, fill: 0xffffff } });
    this.labels.push(t);
    this.container.addChild(t);
    return t;
  }
}