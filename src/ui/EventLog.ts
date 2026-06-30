// File: src/ui/EventLog.ts
// 責務: 左下固定の事件・出来事ログ。種別で色分けし関係キャラのクリック追従を提供。

import { Character } from '../entities/Character';
import { LogConfig } from '../config/GameConfig';

export enum EventCategory {
  Death = 'death',
  Relation = 'relation',
  Treasure = 'treasure',
  Money = 'money',
  Normal = 'normal',
}

export interface EventLogClickHandler {
  (c: Character): void;
}

export class EventLog {
  public readonly root: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly onCharClick: EventLogClickHandler;

  constructor(onCharClick: EventLogClickHandler) {
    this.onCharClick = onCharClick;
    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.left = '8px';
    this.root.style.bottom = '8px';
    this.root.style.width = '360px';
    this.root.style.height = '240px';
    this.root.style.background = 'rgba(15,15,22,0.85)';
    this.root.style.border = '1px solid #40405a';
    this.root.style.borderRadius = '6px';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.zIndex = '500';

    const title = document.createElement('div');
    title.textContent = '事件・出来事ログ';
    title.style.padding = '4px 8px';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '12px';
    title.style.background = '#2a2a3a';
    title.style.borderTopLeftRadius = '6px';
    title.style.borderTopRightRadius = '6px';

    this.list = document.createElement('div');
    this.list.style.flex = '1 1 auto';
    this.list.style.overflowY = 'auto';
    this.list.style.padding = '4px 8px';
    this.list.style.fontSize = '11px';
    this.list.style.lineHeight = '1.5';

    this.root.appendChild(title);
    this.root.appendChild(this.list);
  }

  private color(cat: EventCategory): string {
    switch (cat) {
      case EventCategory.Death:
        return LogConfig.COLOR_DEATH;
      case EventCategory.Relation:
        return LogConfig.COLOR_RELATION;
      case EventCategory.Treasure:
        return LogConfig.COLOR_TREASURE;
      case EventCategory.Money:
        return LogConfig.COLOR_MONEY;
      default:
        return LogConfig.COLOR_NORMAL;
    }
  }

  public push(
    stamp: string,
    text: string,
    cat: EventCategory,
    related: Character[],
  ): void {
    const row = document.createElement('div');
    row.style.color = this.color(cat);
    row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    row.style.paddingBottom = '2px';
    row.style.marginBottom = '2px';

    const textSpan = document.createElement('span');
    textSpan.textContent = `${stamp}${text} `;
    row.appendChild(textSpan);

    for (const c of related) {
      const link = document.createElement('span');
      link.textContent = `[${c.kind === 'npc' ? c.fullName : '魔物'}]`;
      link.style.cursor = 'pointer';
      link.style.textDecoration = 'underline';
      link.style.color = '#9fd0ff';
      link.addEventListener('click', () => this.onCharClick(c));
      row.appendChild(link);
    }

    this.list.appendChild(row);
    while (this.list.childElementCount > LogConfig.MAX_EVENT_LOG) {
      const first = this.list.firstElementChild;
      if (first) {
        first.remove();
      }
    }
    this.list.scrollTop = this.list.scrollHeight;
  }
}