// File: src/render/CharacterView.ts
// 責務: 1キャラクターの描画オブジェクト。本体・武器・HP/MPバー・名前・死亡グレースケール。

import { Container, Graphics, Text, TextStyle, Sprite, Assets as PixiAssets } from 'pixi.js';
import { Character } from '../entities/Character';
import { EntityKind, CharacterState } from '../domain/types';
import { RenderConfig, ColorConfig, StatsConfig } from '../config/GameConfig';
import {
  drawNpcBody,
  drawWeaponIcon,
  drawMonsterBody,
  drawBossBody,
} from './ProceduralDraw';
import { Assets } from './AssetConfig';

export class CharacterView {
  public readonly container: Container;
  private readonly body: Graphics;
  private readonly bars: Graphics;
  private readonly label: Text;
  private readonly subLabel: Text;
  private externalSprite: Sprite | null;

  constructor(private readonly character: Character) {
    this.container = new Container();
    this.body = new Graphics();
    this.bars = new Graphics();
    this.externalSprite = null;

    const nameStyle = new TextStyle({
      fontSize: 9,
      fill: ColorConfig.TEXT,
      stroke: { color: 0x000000, width: 2 },
    });
    this.label = new Text({ text: '', style: nameStyle });
    this.label.anchor.set(0.5, 0);
    this.subLabel = new Text({ text: '', style: nameStyle });
    this.subLabel.anchor.set(0.5, 0);

    this.container.addChild(this.body);
    this.container.addChild(this.bars);
    this.container.addChild(this.label);
    this.container.addChild(this.subLabel);

    this.drawBody();
    this.refreshLabels();
    this.tryLoadExternal();
  }

  private tryLoadExternal(): void {
    let entry = Assets.npc;
    if (this.character.kind === EntityKind.Monster) {
      entry = Assets.monster;
    } else if (this.character.kind === EntityKind.Boss) {
      entry = Assets.boss;
    }
    if (!entry.enabled || entry.url === '') {
      return;
    }
    const url = entry.url;
    void PixiAssets.load(url).then((texture) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.width = RenderConfig.CHAR_RADIUS * 2;
      sprite.height = RenderConfig.CHAR_RADIUS * 2;
      this.body.visible = false;
      this.externalSprite = sprite;
      this.container.addChildAt(sprite, 0);
    });
  }

  private drawBody(): void {
    this.body.clear();
    if (this.character.kind === EntityKind.Npc) {
      const base = this.character.isEvil ? ColorConfig.NPC_EVIL : ColorConfig.NPC_GOOD;
      drawNpcBody(this.body, base);
      drawWeaponIcon(this.body, this.character.inventory.weapon);
    } else if (this.character.kind === EntityKind.Monster) {
      drawMonsterBody(this.body, this.character.monsterTint);
    } else {
      drawBossBody(this.body, this.character.monsterTint);
    }
  }

  private refreshLabels(): void {
    if (this.character.kind === EntityKind.Npc) {
      this.label.text = this.character.displayName;
      this.subLabel.text = `健康${Math.round(this.character.health)}`;
    } else {
      this.label.text = '';
      this.subLabel.text = '';
    }
    this.label.y = RenderConfig.CHAR_RADIUS + 2;
    this.subLabel.y = RenderConfig.CHAR_RADIUS + 13;
  }

  public update(dt: number): void {
    this.container.x = this.character.x;
    this.container.y = this.character.y;

    if (this.character.isDead()) {
      this.container.tint = 0x808080;
      this.body.alpha = 0.6;
    } else {
      this.container.tint = 0xffffff;
      this.body.alpha = 1;
      if (this.character.state === CharacterState.Moving) {
        this.character.animPhase += dt * RenderConfig.ANIM_BOB_SPEED;
        const bob = Math.sin(this.character.animPhase) * RenderConfig.ANIM_BOB_AMPLITUDE;
        this.body.y = bob;
        if (this.externalSprite) {
          this.externalSprite.y = bob;
        }
      } else {
        this.body.y = 0;
        if (this.externalSprite) {
          this.externalSprite.y = 0;
        }
      }
    }

    this.drawBars();
    if (this.character.kind === EntityKind.Npc) {
      this.subLabel.text = `健康${Math.round(this.character.health)}`;
    }
  }

  private drawBars(): void {
    const w = RenderConfig.BAR_WIDTH;
    const h = RenderConfig.BAR_HEIGHT;
    const top = -RenderConfig.CHAR_RADIUS - 10;
    this.bars.clear();
    const hpRatio = Math.max(0, this.character.hp / this.character.hpMax);
    this.bars.rect(-w / 2, top, w, h).fill({ color: ColorConfig.HP_BAR_BG });
    this.bars.rect(-w / 2, top, w * hpRatio, h).fill({ color: ColorConfig.HP_BAR });
    if (this.character.mpMax > 0) {
      const mpRatio = Math.max(0, this.character.mp / this.character.mpMax);
      this.bars.rect(-w / 2, top + h + 1, w, h).fill({ color: ColorConfig.HP_BAR_BG });
      this.bars.rect(-w / 2, top + h + 1, w * mpRatio, h).fill({ color: ColorConfig.MP_BAR });
    }
    if (this.character.health < StatsConfig.HEALTH_MAX) {
      const healthRatio = this.character.health / StatsConfig.HEALTH_MAX;
      this.bars
        .rect(-w / 2, top - h - 1, w * healthRatio, h)
        .fill({ color: 0xffa040, alpha: 0.8 });
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}