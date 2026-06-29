// 責務: 1キャラクターの表示(本体/HP・MPバー/名前・健康度/死亡グレースケール/アニメ)。

import {
  Container,
  ColorMatrixFilter,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { COLORS, WORLD, STATS_RANGE } from '../config/GameConfig';
import { Character } from '../domain/Character';
import {
  drawHumanoid,
  drawMonster,
} from './ProceduralTextures';

const ICON_SIZE = WORLD.TILE_SIZE * 0.9;
const BAR_WIDTH = ICON_SIZE;
const BAR_HEIGHT = 3;

export class CharacterSprite {
  readonly container: Container = new Container();
  readonly character: Character;

  private readonly bodyGraphics: Graphics;
  private readonly bodySprite: Sprite | null;
  private readonly hpBar: Graphics;
  private readonly mpBar: Graphics;
  private readonly label: Text;
  private readonly grayscale: ColorMatrixFilter;

  private wasAlive = true;

  constructor(character: Character, externalTexture: Texture | null) {
    this.character = character;

    this.bodyGraphics = new Graphics();
    if (externalTexture) {
      const sp = new Sprite(externalTexture);
      sp.anchor.set(0.5);
      sp.width = ICON_SIZE;
      sp.height = ICON_SIZE;
      this.bodySprite = sp;
      this.container.addChild(sp);
    } else {
      this.bodySprite = null;
      this.drawBody();
      this.container.addChild(this.bodyGraphics);
    }

    this.hpBar = new Graphics();
    this.mpBar = new Graphics();
    this.container.addChild(this.hpBar);
    this.container.addChild(this.mpBar);

    const style = new TextStyle({
      fontSize: 9,
      fill: COLORS.TEXT,
      align: 'center',
    });
    this.label = new Text({ text: '', style });
    this.label.anchor.set(0.5, 0);
    this.label.position.set(0, ICON_SIZE * 0.6);
    this.container.addChild(this.label);

    this.grayscale = new ColorMatrixFilter();
    this.updateLabel();
    this.updateBars();
  }

  private drawBody(): void {
    const c = this.character;
    if (c.kind === 'npc') {
      const color = c.faction === 'bandit' ? COLORS.FORT : COLORS.NPC_BODY;
      drawHumanoid(this.bodyGraphics, color, c.inventory.weapon, ICON_SIZE);
    } else {
      const ratio = c.monsterStrengthRatio();
      const color = this.monsterColor(ratio);
      const spikes = 5 + Math.floor(ratio * 4);
      drawMonster(this.bodyGraphics, color, spikes, ICON_SIZE);
    }
  }

  /** 強いほどドス黒く、弱いほど淡い。個体差をhueで付与 */
  private monsterColor(ratio: number): number {
    const dark = 1 - ratio * 0.7;
    const base = COLORS.MONSTER_BASE;
    const r = Math.floor(((base >> 16) & 0xff) * dark);
    const g = Math.floor(((base >> 8) & 0xff) * dark * 0.8);
    const b = Math.floor((base & 0xff) * (0.5 + ratio * 0.3));
    return (r << 16) | (g << 8) | b;
  }

  update(totalMinutes: number): void {
    const c = this.character;
    this.container.position.set(c.x, c.y);

    if (c.alive) {
      // 簡易アニメーション(上下バウンド)
      const bob = Math.sin(totalMinutes * 0.3 + c.animPhase) * 1.5;
      const bodyTarget = this.bodySprite ?? this.bodyGraphics;
      bodyTarget.position.y = bob;
      this.updateBars();
    }

    if (this.wasAlive && !c.alive) {
      this.applyDeathVisual();
      this.wasAlive = false;
    }
  }

  private applyDeathVisual(): void {
    this.grayscale.desaturate();
    this.container.filters = [this.grayscale];
    this.hpBar.visible = false;
    this.mpBar.visible = false;
  }

  private updateBars(): void {
    const c = this.character;
    const top = -ICON_SIZE * 0.75;

    this.hpBar.clear();
    this.hpBar
      .rect(-BAR_WIDTH / 2, top, BAR_WIDTH, BAR_HEIGHT)
      .fill({ color: COLORS.HP_BAR_BG });
    const hpRatio = Math.max(0, c.hp / c.maxHp);
    this.hpBar
      .rect(-BAR_WIDTH / 2, top, BAR_WIDTH * hpRatio, BAR_HEIGHT)
      .fill({ color: COLORS.HP_BAR });

    this.mpBar.clear();
    this.mpBar
      .rect(-BAR_WIDTH / 2, top + BAR_HEIGHT + 1, BAR_WIDTH, BAR_HEIGHT)
      .fill({ color: COLORS.HP_BAR_BG });
    const mpRatio = Math.max(0, c.mp / c.maxMp);
    this.mpBar
      .rect(
        -BAR_WIDTH / 2,
        top + BAR_HEIGHT + 1,
        BAR_WIDTH * mpRatio,
        BAR_HEIGHT
      )
      .fill({ color: COLORS.MP_BAR });
  }

  private updateLabel(): void {
    const c = this.character;
    const healthPct = Math.round((c.health / STATS_RANGE.HEALTH_MAX) * 100);
    this.label.text = `${c.displayName}\n健康${healthPct}%`;
  }

  refreshLabel(): void {
    this.updateLabel();
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}