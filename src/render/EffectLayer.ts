// File: src/render/EffectLayer.ts
// 責務: ダメージ・回復・バフ・デバフのフローティング数値とリングエフェクト管理。

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EffectConfig, ColorConfig } from '../config/GameConfig';

interface FloatText {
  text: Text;
  life: number;
  duration: number;
  startY: number;
}

interface RingFx {
  gfx: Graphics;
  life: number;
  color: number;
}

export class EffectLayer {
  public readonly container: Container;
  private readonly floats: FloatText[];
  private readonly rings: RingFx[];

  constructor() {
    this.container = new Container();
    this.floats = [];
    this.rings = [];
  }

  public spawnDamage(x: number, y: number, amount: number): void {
    this.spawnText(x, y, `-${amount}`, ColorConfig.EFFECT_DAMAGE);
    this.spawnRing(x, y, ColorConfig.EFFECT_DAMAGE);
  }

  public spawnHeal(x: number, y: number, amount: number): void {
    this.spawnText(x, y, `+${amount}`, ColorConfig.EFFECT_HEAL);
  }

  public spawnBuff(x: number, y: number): void {
    this.spawnRing(x, y, ColorConfig.EFFECT_BUFF);
  }

  public spawnDebuff(x: number, y: number): void {
    this.spawnRing(x, y, ColorConfig.EFFECT_DEBUFF);
  }

  private spawnText(x: number, y: number, content: string, color: number): void {
    const style = new TextStyle({
      fontSize: 14,
      fill: color,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 3 },
    });
    const text = new Text({ text: content, style });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    this.container.addChild(text);
    this.floats.push({
      text,
      life: 0,
      duration: EffectConfig.FLOAT_TEXT_DURATION,
      startY: y,
    });
  }

  private spawnRing(x: number, y: number, color: number): void {
    const gfx = new Graphics();
    gfx.x = x;
    gfx.y = y;
    this.container.addChild(gfx);
    this.rings.push({ gfx, life: 0, color });
  }

  public update(dt: number): void {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life += dt;
      const t = f.life / f.duration;
      f.text.y = f.startY - t * EffectConfig.FLOAT_TEXT_RISE;
      f.text.alpha = 1 - t;
      if (f.life >= f.duration) {
        this.container.removeChild(f.text);
        f.text.destroy();
        this.floats.splice(i, 1);
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life += dt;
      const t = r.life / EffectConfig.RING_DURATION;
      const radius = t * EffectConfig.RING_MAX_RADIUS;
      r.gfx.clear();
      r.gfx.circle(0, 0, radius).stroke({ width: 2, color: r.color, alpha: 1 - t });
      if (r.life >= EffectConfig.RING_DURATION) {
        this.container.removeChild(r.gfx);
        r.gfx.destroy();
        this.rings.splice(i, 1);
      }
    }
  }
}