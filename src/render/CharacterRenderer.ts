// src/render/CharacterRenderer.ts
// 責務: 全キャラクターの動的描画（ボディ・HP/MPバー・名前ラベル・健康度・死亡グレースケール・簡易アニメ）を担う。

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import type { CharacterData } from '../domain/types';
import type { EntityId } from '../domain/ids';
import { CharacterKind, LifeState } from '../domain/enums';
import { ENTITY_SIZE, BARS } from '../config/constants';
import { applyGrayscale } from './ColorUtil';
import { characterDisplayName } from '../entities/Character';

const NAME_STYLE = new TextStyle({
  fill: 0xffffff,
  fontSize: 14,
  fontFamily: 'sans-serif',
  align: 'center',
  stroke: { color: 0x000000, width: 3 },
});

interface CharVisual {
  wrap: Container;
  body: Graphics;
  bars: Graphics;
  label: Text;
  lastTint: number;
  lastState: LifeState;
}

export type CharacterClickHandler = (id: EntityId) => void;

export class CharacterRenderer {
  readonly container: Container;
  private readonly visuals: Map<EntityId, CharVisual> = new Map();
  private readonly onClick: CharacterClickHandler;

  constructor(onClick: CharacterClickHandler) {
    this.container = new Container();
    this.onClick = onClick;
  }

  private radiusOf(c: CharacterData): number {
    if (c.kind === CharacterKind.Boss) return ENTITY_SIZE.CHARACTER_RADIUS * 1.6;
    if (c.kind === CharacterKind.NPC) return ENTITY_SIZE.CHARACTER_RADIUS;
    return ENTITY_SIZE.MONSTER_RADIUS;
  }

  private drawBody(g: Graphics, c: CharacterData, tint: number): void {
    g.clear();
    const r = this.radiusOf(c);
    if (c.kind === CharacterKind.NPC) {
      g.circle(0, 0, r).fill({ color: tint });
      g.circle(0, -r * 0.2, r * 0.45).fill({ color: 0xffe0bd });
      g.rect(-r * 0.5, r * 0.2, r, r * 0.7).fill({ color: tint });
    } else {
      g.poly([0, -r, r, r, -r, r]).fill({ color: tint });
      g.circle(-r * 0.35, 0, r * 0.18).fill({ color: 0xff2020 });
      g.circle(r * 0.35, 0, r * 0.18).fill({ color: 0xff2020 });
    }
  }

  private drawBars(g: Graphics, c: CharacterData): void {
    g.clear();
    const r = this.radiusOf(c);
    const w = BARS.WIDTH;
    const h = BARS.HEIGHT;
    const top = -r - h * 2 - BARS.GAP - 4;
    const hpRatio = Math.max(0, c.attr.hp / c.attr.maxHp);
    const mpRatio = Math.max(0, c.attr.mp / c.attr.maxMp);
    g.rect(-w / 2, top, w, h).fill({ color: 0x331010 });
    g.rect(-w / 2, top, w * hpRatio, h).fill({ color: 0xff3b3b });
    const mpTop = top + h + BARS.GAP;
    g.rect(-w / 2, mpTop, w, h).fill({ color: 0x101a33 });
    g.rect(-w / 2, mpTop, w * mpRatio, h).fill({ color: 0x3b8bff });
  }

  private createVisual(c: CharacterData): CharVisual {
    const wrap = new Container();
    wrap.eventMode = 'static';
    wrap.cursor = 'pointer';
    const id = c.id;
    wrap.on('pointertap', () => this.onClick(id));

    const body = new Graphics();
    this.drawBody(body, c, c.tint);
    wrap.addChild(body);

    const bars = new Graphics();
    this.drawBars(bars, c);
    wrap.addChild(bars);

    const label = new Text({ text: '', style: NAME_STYLE });
    label.anchor.set(0.5, 0);
    label.y = this.radiusOf(c) + 4;
    wrap.addChild(label);

    this.container.addChild(wrap);
    return { wrap, body, bars, label, lastTint: c.tint, lastState: c.state };
  }

  update(world: WorldState): void {
    const seen = new Set<EntityId>();
    for (const c of world.characters.values()) {
      seen.add(c.id);
      let v = this.visuals.get(c.id);
      if (!v) {
        v = this.createVisual(c);
        this.visuals.set(c.id, v);
      }
      v.wrap.x = c.position.x;
      v.wrap.y = c.position.y;

      const isDead = c.state === LifeState.Dead;
      const targetTint = isDead ? applyGrayscale(c.tint) : c.tint;
      if (v.lastTint !== targetTint || v.lastState !== c.state) {
        this.drawBody(v.body, c, targetTint);
        v.lastTint = targetTint;
        v.lastState = c.state;
      }

      v.bars.visible = !isDead;
      if (!isDead) {
        this.drawBars(v.bars, c);
        const bob = Math.sin(c.animPhase) * 2;
        v.body.y = bob;
      } else {
        v.body.y = 0;
      }

      const healthMark = c.attr.health < 100 ? `❤${Math.round(c.attr.health)}` : '';
      v.label.text = `${characterDisplayName(c)}\n${healthMark}`;
      v.label.alpha = isDead ? 0.5 : 1;
    }

    for (const [id, v] of this.visuals) {
      if (!seen.has(id)) {
        v.wrap.destroy({ children: true });
        this.visuals.delete(id);
      }
    }
  }
}