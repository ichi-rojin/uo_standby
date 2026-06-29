// 責務: ダメージ数字・ヒットフラッシュ・バフ/デバフオーラ等の一過性エフェクト管理。

import {
  Container,
  Graphics,
  Text,
  TextStyle,
} from 'pixi.js';
import { COLORS, EFFECT } from '../config/GameConfig';

interface ActiveEffect {
  display: Container;
  ageMs: number;
  lifeMs: number;
  vy: number;
  kind: 'text' | 'flash' | 'aura';
}

export class EffectLayer {
  readonly container: Container = new Container();
  private readonly effects: ActiveEffect[] = [];

  spawnDamageText(x: number, y: number, amount: number, heal: boolean): void {
    const style = new TextStyle({
      fontSize: 14,
      fill: heal ? COLORS.HEAL : COLORS.DAMAGE,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 3 },
    });
    const t = new Text({
      text: `${heal ? '+' : '-'}${Math.round(amount)}`,
      style,
    });
    t.anchor.set(0.5);
    t.position.set(x, y);
    this.container.addChild(t);
    this.effects.push({
      display: t,
      ageMs: 0,
      lifeMs: EFFECT.DAMAGE_TEXT_LIFE_MS,
      vy: -0.04,
      kind: 'text',
    });
  }

  spawnHitFlash(x: number, y: number): void {
    const g = new Graphics();
    g.circle(0, 0, 16).fill({ color: 0xffffff, alpha: 0.8 });
    g.position.set(x, y);
    this.container.addChild(g);
    this.effects.push({
      display: g,
      ageMs: 0,
      lifeMs: EFFECT.HIT_FLASH_LIFE_MS,
      vy: 0,
      kind: 'flash',
    });
  }

  spawnAura(x: number, y: number, buff: boolean): void {
    const g = new Graphics();
    g.circle(0, 0, 20).stroke({
      width: 3,
      color: buff ? COLORS.BUFF : COLORS.DEBUFF,
      alpha: 0.9,
    });
    g.position.set(x, y);
    this.container.addChild(g);
    this.effects.push({
      display: g,
      ageMs: 0,
      lifeMs: EFFECT.AURA_LIFE_MS,
      vy: 0,
      kind: 'aura',
    });
  }

  /** realDtMs: 実時間ミリ秒 */
  update(realDtMs: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.ageMs += realDtMs;
      const lifeRatio = e.ageMs / e.lifeMs;
      if (lifeRatio >= 1) {
        e.display.destroy();
        this.effects.splice(i, 1);
        continue;
      }
      e.display.alpha = 1 - lifeRatio;
      if (e.kind === 'text') {
        e.display.position.y += e.vy * realDtMs;
      } else if (e.kind === 'aura') {
        const s = 1 + lifeRatio * 0.8;
        e.display.scale.set(s);
      } else if (e.kind === 'flash') {
        const s = 1 + lifeRatio * 0.5;
        e.display.scale.set(s);
      }
    }
  }
}