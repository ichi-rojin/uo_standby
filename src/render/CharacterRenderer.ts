// 責務: キャラクターのアイコン/HPバー/MPバー/ラベルの動的描画とカリング
import { Container, Graphics, Text, Sprite, Assets, Texture } from 'pixi.js';
import { RENDER, HEALTH } from '../config/constants';
import { SPRITE_SETTINGS } from '../config/settings';
import { drawNpcIcon, drawMonsterIcon, drawBossIcon } from './proceduralTextures';
import { displayName } from '../systems/combatSystem';
import type { Character, EntityId } from '../domain/types';
import type { GameState } from '../state/gameState';

type CharView = {
  root: Container;
  icon: Graphics;
  sprite: Sprite | null;
  hpBar: Graphics;
  mpBar: Graphics;
  label: Text;
  built: boolean;
};

const HP_COLOR = 0x40ff40;
const MP_COLOR = 0x4080ff;
const BAR_BG = 0x303030;

export class CharacterRenderer {
  readonly container = new Container();
  private readonly views = new Map<EntityId, CharView>();
  private readonly externalTextures = new Map<string, Texture>();

  async preloadExternal(): Promise<void> {
    if (!SPRITE_SETTINGS.useExternalImages) return;
    const entries = Object.entries(SPRITE_SETTINGS.textures);
    for (const [kind, url] of entries) {
      if (!url) continue;
      const tex = await Assets.load<Texture>(url);
      this.externalTextures.set(kind, tex);
    }
  }

  render(
    state: GameState,
    viewLeft: number,
    viewTop: number,
    viewRight: number,
    viewBottom: number,
  ): void {
    const seen = new Set<EntityId>();
    for (const c of state.characters.values()) {
      if (
        c.x < viewLeft - RENDER.CULL_PADDING ||
        c.x > viewRight + RENDER.CULL_PADDING ||
        c.y < viewTop - RENDER.CULL_PADDING ||
        c.y > viewBottom + RENDER.CULL_PADDING
      ) {
        const hidden = this.views.get(c.id);
        if (hidden) hidden.root.visible = false;
        continue;
      }
      seen.add(c.id);
      const view = this.acquire(c);
      this.updateView(view, c);
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        view.root.visible = false;
        if (!state.characters.has(id)) {
          this.container.removeChild(view.root);
          view.root.destroy({ children: true });
          this.views.delete(id);
        }
      }
    }
  }

  private acquire(c: Character): CharView {
    const existing = this.views.get(c.id);
    if (existing) return existing;
    const root = new Container();
    const icon = new Graphics();
    const hpBar = new Graphics();
    const mpBar = new Graphics();
    const label = new Text({
      text: '',
      style: { fontSize: 10, fill: 0xffffff, align: 'center' },
    });
    label.anchor.set(0.5, 0);
    root.addChild(icon);
    root.addChild(hpBar);
    root.addChild(mpBar);
    root.addChild(label);
    this.container.addChild(root);
    const view: CharView = { root, icon, sprite: null, hpBar, mpBar, label, built: false };
    this.views.set(c.id, view);
    return view;
  }

  private buildIcon(view: CharView, c: Character): void {
    const tex = this.externalTextures.get(c.kind);
    if (SPRITE_SETTINGS.useExternalImages && tex) {
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = RENDER.ICON_RADIUS * 2;
      sprite.height = RENDER.ICON_RADIUS * 2;
      view.root.addChildAt(sprite, 0);
      view.sprite = sprite;
    } else {
      view.icon.clear();
      if (c.kind === 'boss') drawBossIcon(view.icon);
      else if (c.kind === 'monster') drawMonsterIcon(view.icon, c);
      else drawNpcIcon(view.icon, c);
    }
    view.built = true;
  }

  private updateView(view: CharView, c: Character): void {
    view.root.visible = true;
    view.root.position.set(c.x, c.y);
    if (!view.built) this.buildIcon(view, c);

    const wobble = c.alive ? Math.sin(c.animPhase) * 2 : 0;
    view.icon.y = wobble;
    if (view.sprite) view.sprite.y = wobble;

    if (!c.alive) {
      view.root.alpha = 0.5;
      view.icon.tint = 0x808080;
      if (view.sprite) view.sprite.tint = 0x808080;
    } else {
      view.root.alpha = 1;
      view.icon.tint = 0xffffff;
      if (view.sprite) view.sprite.tint = 0xffffff;
    }

    this.drawBars(view, c);
    this.drawLabel(view, c);
  }

  private drawBars(view: CharView, c: Character): void {
    const w = RENDER.BAR_WIDTH;
    const h = RENDER.BAR_HEIGHT;
    const top = -RENDER.ICON_RADIUS - 14;
    view.hpBar.clear();
    view.hpBar
      .rect(-w / 2, top, w, h)
      .fill({ color: BAR_BG })
      .rect(-w / 2, top, w * (c.stats.hp / c.stats.hpMax), h)
      .fill({ color: HP_COLOR });
    view.mpBar.clear();
    view.mpBar
      .rect(-w / 2, top + h + 1, w, h)
      .fill({ color: BAR_BG })
      .rect(-w / 2, top + h + 1, w * (c.stats.mp / Math.max(1, c.stats.mpMax)), h)
      .fill({ color: MP_COLOR });
  }

  private drawLabel(view: CharView, c: Character): void {
    const healthPct = Math.round((c.stats.health / HEALTH.MAX) * 100);
    if (c.kind === 'monster' || c.kind === 'boss') {
      view.label.text = displayName(c);
    } else {
      view.label.text = `${displayName(c)}\n健康:${healthPct}%`;
    }
    view.label.position.set(0, RENDER.LABEL_OFFSET);
  }
}