// src/render/EffectRenderer.ts
// 責務: エフェクトインスタンス（ダメージ数値・バフ/デバフリング・ヒットフラッシュ）の毎フレーム描画を担う。

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import type { EntityId } from '../domain/ids';
import { EffectKind } from '../domain/enums';
import type { EffectInstance } from '../domain/types';

const DAMAGE_TEXT_STYLE = new TextStyle({
  fill: 0xff5555,
  fontSize: 22,
  fontWeight: 'bold',
  fontFamily: 'sans-serif',
  stroke: { color: 0x000000, width: 4 },
});

const RING_MAX_RADIUS = 50;

interface EffectVisual {
  node: Container;
  graphics: Graphics;
  text: Text | null;
}

export class EffectRenderer {
  readonly container: Container;
  private readonly visuals: Map<EntityId, EffectVisual> = new Map();

  constructor() {
    this.container = new Container();
  }

  private createVisual(e: EffectInstance): EffectVisual {
    const node = new Container();
    const graphics = new Graphics();
    node.addChild(graphics);
    let text: Text | null = null;
    if (e.kind === EffectKind.DamageText) {
      text = new Text({ text: e.text, style: DAMAGE_TEXT_STYLE });
      text.anchor.set(0.5);
      node.addChild(text);
    }
    this.container.addChild(node);
    return { node, graphics, text };
  }

  private drawEffect(v: EffectVisual, e: EffectInstance): void {
    const progress = e.age / e.duration;
    v.node.x = e.position.x;
    v.node.y = e.position.y;
    v.graphics.clear();
    switch (e.kind) {
      case EffectKind.HitFlash: {
        v.graphics.circle(0, 0, 18 * (1 - progress)).fill({ color: e.color, alpha: 1 - progress });
        break;
      }
      case EffectKind.BuffRing:
      case EffectKind.DebuffRing: {
        const r = RING_MAX_RADIUS * progress;
        v.graphics
          .circle(0, 0, r)
          .stroke({ color: e.color, width: 4, alpha: 1 - progress });
        break;
      }
      case EffectKind.DamageText: {
        if (v.text) v.text.alpha = 1 - progress;
        break;
      }
      default:
        break;
    }
  }

  update(world: WorldState): void {
    const seen = new Set<EntityId>();
    for (const e of world.effects) {
      seen.add(e.id);
      let v = this.visuals.get(e.id);
      if (!v) {
        v = this.createVisual(e);
        this.visuals.set(e.id, v);
      }
      this.drawEffect(v, e);
    }
    for (const [id, v] of this.visuals) {
      if (!seen.has(id)) {
        v.node.destroy({ children: true });
        this.visuals.delete(id);
      }
    }
  }
}