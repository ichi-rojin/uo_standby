// src/ui/UIManager.ts
// 責務: DOM UI 群（時間制御・ログパネル・キャラ/都市ウインドウ）の生成と相互連携を統括する。

import { EventLog } from '../log/EventLog';
import { WorldState } from '../world/WorldState';
import { Camera } from '../render/Camera';
import { TimeControlPanel } from './TimeControlPanel';
import type { SpeedChangeHandler } from './TimeControlPanel';
import { EventLogPanel } from './EventLogPanel';
import { DraggableWindow } from './DraggableWindow';
import type { EntityId } from '../domain/ids';
import type { CharacterData, CityData } from '../domain/types';
import { LifeState } from '../domain/enums';
import { characterDisplayName } from '../entities/Character';
import { formatDate } from '../util/time';
import { UI_COLORS } from './uiStyles';

export class UIManager {
  private readonly parent: HTMLElement;
  private readonly world: WorldState;
  private readonly camera: Camera;
  readonly timePanel: TimeControlPanel;
  private windowOffset = 0;

  constructor(
    parent: HTMLElement,
    world: WorldState,
    camera: Camera,
    log: EventLog,
    onSpeedChange: SpeedChangeHandler,
  ) {
    this.parent = parent;
    this.world = world;
    this.camera = camera;
    this.timePanel = new TimeControlPanel(parent, onSpeedChange);
    new EventLogPanel(parent, log, (id) => this.openCharacterWindow(id));
  }

  private nextWindowPos(): { x: number; y: number } {
    const x = 300 + (this.windowOffset % 5) * 30;
    const y = 80 + (this.windowOffset % 5) * 30;
    this.windowOffset += 1;
    return { x, y };
  }

  openCharacterWindow(id: EntityId): void {
    const c = this.world.characters.get(id);
    if (!c) return;
    if (c.state === LifeState.Alive || c.state === LifeState.Dead) {
      this.camera.focusOn(c.position);
    }
    const pos = this.nextWindowPos();
    const win = new DraggableWindow(characterDisplayName(c), this.parent, pos.x, pos.y, 320);
    win.setBodyHtml(this.buildCharacterHtml(c));
  }

  openCityWindow(id: EntityId): void {
    const city = this.world.cities.find((x) => x.id === id);
    if (!city) return;
    this.camera.focusOn(city.position);
    const pos = this.nextWindowPos();
    const win = new DraggableWindow(city.name, this.parent, pos.x, pos.y, 340);
    win.setBodyHtml(this.buildCityHtml(city));
  }

  private buildCharacterHtml(c: CharacterData): string {
    const a = c.attr;
    const s = c.skills;
    const inv = c.inventory;
    const stateText = c.state === LifeState.Dead ? '死亡' : '生存';
    const attrRows = `
      <div>種別: ${c.kind} / 状態: ${stateText}</div>
      <div>性格: ${c.personality}</div>
      <div>HP: ${Math.round(a.hp)}/${a.maxHp} MP: ${Math.round(a.mp)}/${a.maxMp}</div>
      <div>健康度: ${Math.round(a.health)}</div>
      <div>体格:${a.build} 瞬発:${a.agility} 反応:${a.reaction}</div>
      <div>知覚:${a.perception} 巧緻:${a.dexterity} 魔力:${a.magic}</div>
      <hr/>
      <div><b>スキル</b></div>
      <div>剣:${s.sword} 長柄:${s.polearm} 弓:${s.bow}</div>
      <div>攻撃魔法:${s.magicAttack} バフ:${s.magicBuff} デバフ:${s.magicDebuff}</div>
      <div>地図把握:${s.mapKnowledge}</div>
      <hr/>
      <div><b>所持品</b></div>
      <div>武器:${inv.weapon} 食料:${inv.food} 値打物:${inv.valuables} 金:${inv.gold}</div>
      <hr/>
      <div><b>履歴</b></div>
    `;
    const historyHtml =
      c.history.length === 0
        ? '<div style="opacity:0.6">履歴なし</div>'
        : c.history
            .map((h) => `<div>${formatDate(h.date)}に ${h.text}</div>`)
            .join('');
    return attrRows + historyHtml;
  }

  private buildCityHtml(city: CityData): string {
    const residents: CharacterData[] = [];
    for (const rid of city.residentIds) {
      const r = this.world.characters.get(rid);
      if (r && r.state === LifeState.Alive) residents.push(r);
    }
    const residentHtml =
      residents.length === 0
        ? '<div style="opacity:0.6">滞在NPCなし</div>'
        : residents.map((r) => `<div>・${characterDisplayName(r)}</div>`).join('');
    const questHtml =
      city.quests.length === 0
        ? '<div style="opacity:0.6">クエストなし</div>'
        : city.quests
            .map((q) => `<div>・${q.title}（報酬${q.reward}）</div>`)
            .join('');
    const eventHtml =
      city.events.length === 0
        ? '<div style="opacity:0.6">出来事なし</div>'
        : city.events
            .map((e) => `<div>${formatDate(e.date)}に ${e.text}</div>`)
            .join('');
    return `
      <div>人口: ${city.population}</div>
      <div>滞在NPC数: ${residents.length}</div>
      <hr/>
      <div style="color:${UI_COLORS.relation}"><b>滞在NPC</b></div>
      ${residentHtml}
      <hr/>
      <div style="color:${UI_COLORS.treasure}"><b>発注クエスト</b></div>
      ${questHtml}
      <hr/>
      <div style="color:${UI_COLORS.money}"><b>都市内出来事</b></div>
      ${eventHtml}
    `;
  }
}