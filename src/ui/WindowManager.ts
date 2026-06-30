// File: src/ui/WindowManager.ts
// 責務: キャラクター・都市ウインドウの生成と管理、クリック時のカメラ追従連携。

import { DraggableWindow } from './DraggableWindow';
import { Character } from '../entities/Character';
import { City } from '../entities/City';
import { EntityKind, Gender } from '../domain/types';

export interface FollowHandle {
  setFollow(target: Character | null): void;
  focusOn(x: number, y: number): void;
}

export class WindowManager {
  private readonly host: HTMLElement;
  private readonly openChar: Map<number, DraggableWindow>;
  private readonly openCity: Map<number, DraggableWindow>;
  private offset: number;

  constructor(host: HTMLElement, private readonly follow: FollowHandle) {
    this.host = host;
    this.openChar = new Map();
    this.openCity = new Map();
    this.offset = 0;
  }

  private nextPos(): { x: number; y: number } {
    const x = 120 + (this.offset % 5) * 30;
    const y = 80 + (this.offset % 5) * 30;
    this.offset++;
    return { x, y };
  }

  public openCharacter(c: Character): void {
    const existing = this.openChar.get(c.id);
    if (existing) {
      existing.root.style.zIndex = '1100';
      return;
    }
    const win = new DraggableWindow(c.kind === EntityKind.Npc ? c.displayName : '魔物', 320, 460);
    win.setContent(this.renderCharacter(c));
    const p = this.nextPos();
    win.setPosition(p.x, p.y);
    win.setOnClose(() => this.openChar.delete(c.id));
    this.host.appendChild(win.root);
    this.openChar.set(c.id, win);

    if (!c.isDead()) {
      this.follow.setFollow(c);
    } else {
      this.follow.focusOn(c.x, c.y);
    }
  }

  public openCity(city: City): void {
    const existing = this.openCity.get(city.id);
    if (existing) {
      existing.root.style.zIndex = '1100';
      return;
    }
    const win = new DraggableWindow(city.name, 340, 460);
    win.setContent(this.renderCity(city));
    const p = this.nextPos();
    win.setPosition(p.x, p.y);
    win.setOnClose(() => this.openCity.delete(city.id));
    this.host.appendChild(win.root);
    this.openCity.set(city.id, win);
    this.follow.focusOn(city.x, city.y);
  }

  private genderLabel(g: Gender): string {
    return g === Gender.Male ? '男性' : '女性';
  }

  private renderCharacter(c: Character): string {
    const a = c.attributes;
    const s = c.skills;
    const inv = c.inventory;
    const histRows = c.history
      .slice(-30)
      .reverse()
      .map((h) => `<div>${h.stamp}${h.text}</div>`)
      .join('');
    return `
      <div style="line-height:1.6;">
        <div style="font-size:13px;font-weight:bold;">${c.displayName}</div>
        <div>性別: ${this.genderLabel(c.gender)} / ${c.isEvil ? '悪徳' : '善良'}</div>
        <div>HP ${Math.round(c.hp)}/${c.hpMax} MP ${Math.round(c.mp)}/${c.mpMax}</div>
        <div>健康度 ${Math.round(c.health)}</div>
        <div>状態 ${c.isDead() ? '死亡' : c.state}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">能力値</div>
        <div>体格 ${a.physique} / 瞬発力 ${a.agility} / 反応 ${a.reaction}</div>
        <div>知覚 ${a.perception} / 巧緻性 ${a.dexterity} / 魔法力 ${a.magicPower}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">スキル</div>
        <div>剣 ${s.sword} / 長柄 ${s.polearm} / 弓 ${s.bow}</div>
        <div>魔法攻撃 ${s.magicAttack} / 魔法バフ ${s.magicBuff} / 魔法デバフ ${s.magicDebuff}</div>
        <div>地図把握 ${s.mapKnowledge}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">所持品</div>
        <div>武器 ${inv.weapon} / 食料 ${inv.food} / 値打物 ${inv.valuables} / 金銭 ${inv.money}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">履歴</div>
        <div style="font-size:11px;color:#c0c0d0;">${histRows || '（なし）'}</div>
      </div>
    `;
  }

  private renderCity(city: City): string {
    const questRows =
      city.quests.map((q) => `<div>・${q.text}</div>`).join('') || '（なし）';
    const eventRows =
      city.events
        .slice(-20)
        .reverse()
        .map((e) => `<div>${e.stamp}${e.text}</div>`)
        .join('') || '（なし）';
    const stayRows =
      Array.from(city.stayingNpcIds.values())
        .map((id) => `<div>NPC#${id}</div>`)
        .join('') || '（なし）';
    return `
      <div style="line-height:1.6;">
        <div style="font-size:13px;font-weight:bold;">${city.name}</div>
        <div>人口 ${city.population} / 滞在 ${city.stayingNpcIds.size}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">発注クエスト</div>
        <div style="font-size:11px;">${questRows}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">滞在NPC</div>
        <div style="font-size:11px;">${stayRows}</div>
        <hr style="border-color:#404050;">
        <div style="font-weight:bold;">都市内出来事</div>
        <div style="font-size:11px;color:#c0c0d0;">${eventRows}</div>
      </div>
    `;
  }
}