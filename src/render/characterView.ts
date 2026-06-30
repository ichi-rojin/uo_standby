// 責務: キャラクター1体の表示(本体/バー/名前/グレースケール/アニメ)
import { Container, Graphics, Text, ColorMatrixFilter } from 'pixi.js';
import { ENTITY, COLORS } from '../config/constants';
import { drawNpcBody, drawMonsterBody } from './proceduralTextures';
import type { Character } from '../entities/character';

export class CharacterView {
  container: Container;
  private body: Graphics;
  private hpBar: Graphics;
  private mpBar: Graphics;
  private nameText: Text;
  private grayFilter: ColorMatrixFilter;
  private wasAlive: boolean;

  constructor(c: Character) {
    this.container = new Container();
    this.body = new Graphics();
    this.hpBar = new Graphics();
    this.mpBar = new Graphics();
    this.grayFilter = new ColorMatrixFilter();
    this.grayFilter.desaturate();
    this.wasAlive = true;
    this.nameText = new Text({
      text: '',
      style: { fill: 0xffffff, fontSize: 9 }
    });
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = ENTITY.NPC_RADIUS + 6;
    this.container.addChild(this.body, this.hpBar, this.mpBar, this.nameText);
    this.redrawBody(c);
    this.updateName(c);
  }

  private redrawBody(c: Character): void {
    if (c.kind === 'monster') drawMonsterBody(this.body, c);
    else drawNpcBody(this.body, c);
  }

  updateName(c: Character): void {
    if (c.kind === 'monster') {
      this.nameText.text = `${c.title}`;
    } else {
      this.nameText.text = `${c.fullName()} HP${Math.round(c.ab.health)}`;
    }
  }

  update(c: Character): void {
    this.container.x = c.pos.x;
    this.container.y = c.pos.y;
    const bob = c.alive ? Math.sin(c.animPhase) * 1.5 : 0;
    this.body.y = bob;

    if (c.alive !== this.wasAlive) {
      this.container.filters = c.alive ? [] : [this.grayFilter];
      this.wasAlive = c.alive;
    }

    const w = ENTITY.BAR_WIDTH;
    const h = ENTITY.BAR_HEIGHT;
    const top = -ENTITY.NPC_RADIUS - 12;
    this.hpBar.clear();
    this.hpBar.rect(-w / 2, top, w, h).fill({ color: 0x222222 });
    this.hpBar.rect(-w / 2, top, w * Math.max(0, c.ab.hp / c.ab.maxHp), h).fill({ color: COLORS.HP });
    this.mpBar.clear();
    this.mpBar.rect(-w / 2, top + h + 1, w, h).fill({ color: 0x222222 });
    if (c.ab.maxMp > 0) {
      this.mpBar.rect(-w / 2, top + h + 1, w * Math.max(0, c.ab.mp / c.ab.maxMp), h).fill({ color: COLORS.MP });
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}