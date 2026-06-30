// 責務: ダメージ/回復/バフ/デバフの視覚エフェクト
import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../config/constants';

interface ActiveEffect {
  g: Graphics | Text;
  ttl: number;
  vy: number;
}

export class EffectLayer {
  container: Container;
  private effects: ActiveEffect[] = [];

  constructor() {
    this.container = new Container();
  }

  damage(x: number, y: number, amount: number): void {
    const t = new Text({
      text: `-${Math.round(amount)}`,
      style: { fill: COLORS.EFFECT_DMG, fontSize: 14, fontWeight: 'bold' }
    });
    t.x = x; t.y = y;
    this.container.addChild(t);
    this.effects.push({ g: t, ttl: 30, vy: -1 });
  }

  heal(x: number, y: number, amount: number): void {
    const t = new Text({
      text: `+${Math.round(amount)}`,
      style: { fill: COLORS.EFFECT_HEAL, fontSize: 14, fontWeight: 'bold' }
    });
    t.x = x; t.y = y;
    this.container.addChild(t);
    this.effects.push({ g: t, ttl: 30, vy: -1 });
  }

  ring(x: number, y: number, kind: 'buff' | 'debuff'): void {
    const g = new Graphics();
    const color = kind === 'buff' ? COLORS.EFFECT_BUFF : COLORS.EFFECT_DEBUFF;
    g.circle(0, 0, 8).stroke({ width: 2, color });
    g.x = x; g.y = y;
    this.container.addChild(g);
    this.effects.push({ g, ttl: 25, vy: -0.5 });
  }

  update(): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.g.y += e.vy;
      e.ttl--;
      e.g.alpha = Math.max(0, e.ttl / 30);
      if (e.g instanceof Graphics) e.g.scale.set(1 + (25 - e.ttl) * 0.05);
      if (e.ttl <= 0) {
        this.container.removeChild(e.g);
        e.g.destroy();
        this.effects.splice(i, 1);
      }
    }
  }
}