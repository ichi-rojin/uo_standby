// src/ui/EventLogPanel.ts
// 責務: 左下固定の事件・出来事ログと右側スタックの会話ログをDOM描画し、キャラクリックを仲介する。

import { applyStyle, basePanelStyle, UI_COLORS } from './uiStyles';
import { EventLog } from '../log/EventLog';
import type { EventLogEntry, ChatLogEntry } from '../domain/types';
import { EventCategory } from '../domain/enums';
import type { EntityId } from '../domain/ids';
import { formatDate } from '../util/time';
import { LOG } from '../config/constants';

export type LogCharacterClickHandler = (id: EntityId) => void;

function categoryColor(cat: EventCategory): string {
  switch (cat) {
    case EventCategory.Death:
      return UI_COLORS.death;
    case EventCategory.Relation:
      return UI_COLORS.relation;
    case EventCategory.Treasure:
      return UI_COLORS.treasure;
    case EventCategory.Money:
      return UI_COLORS.money;
    default:
      return UI_COLORS.generic;
  }
}

export class EventLogPanel {
  private readonly eventRoot: HTMLDivElement;
  private readonly chatRoot: HTMLDivElement;
  private readonly onClick: LogCharacterClickHandler;

  constructor(parent: HTMLElement, log: EventLog, onClick: LogCharacterClickHandler) {
    this.onClick = onClick;

    this.eventRoot = document.createElement('div');
    applyStyle(this.eventRoot, basePanelStyle());
    applyStyle(this.eventRoot, {
      left: '10px',
      bottom: '10px',
      width: '420px',
      height: '230px',
      overflowY: 'auto',
      padding: '6px 8px',
    });
    parent.appendChild(this.eventRoot);

    this.chatRoot = document.createElement('div');
    applyStyle(this.chatRoot, basePanelStyle());
    applyStyle(this.chatRoot, {
      right: '10px',
      top: '10px',
      width: '320px',
      maxHeight: '70vh',
      overflowY: 'auto',
      padding: '6px 8px',
    });
    parent.appendChild(this.chatRoot);

    log.onEvent((e) => this.addEvent(e));
    log.onChat((c) => this.addChat(c));
  }

  private makeCharacterSpan(id: EntityId, name: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = name;
    applyStyle(span, {
      textDecoration: 'underline',
      cursor: 'pointer',
      color: '#9fd0ff',
    });
    span.addEventListener('click', () => this.onClick(id));
    return span;
  }

  private addEvent(e: EventLogEntry): void {
    const line = document.createElement('div');
    applyStyle(line, {
      marginBottom: '3px',
      color: categoryColor(e.category),
      lineHeight: '1.3',
    });
    const prefix = document.createElement('span');
    prefix.textContent = `${formatDate(e.date)}に `;
    line.appendChild(prefix);
    const msg = document.createElement('span');
    msg.textContent = e.message;
    line.appendChild(msg);
    this.eventRoot.insertBefore(line, this.eventRoot.firstChild);
    while (this.eventRoot.childElementCount > LOG.MAX_EVENT_ENTRIES) {
      const last = this.eventRoot.lastElementChild;
      if (last) last.remove();
    }
  }

  private addChat(c: ChatLogEntry): void {
    const line = document.createElement('div');
    applyStyle(line, {
      marginBottom: '5px',
      padding: '4px 6px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '4px',
      position: 'relative',
    });
    const speaker = this.makeCharacterSpan(c.speakerId, c.speakerName);
    line.appendChild(speaker);
    const body = document.createElement('div');
    body.textContent = `「${c.message}」`;
    applyStyle(body, { color: UI_COLORS.text, marginTop: '2px' });
    line.appendChild(body);

    const close = document.createElement('span');
    close.textContent = '×';
    applyStyle(close, {
      position: 'absolute',
      top: '2px',
      right: '4px',
      cursor: 'pointer',
      color: UI_COLORS.death,
    });
    close.addEventListener('click', () => line.remove());
    line.appendChild(close);

    this.chatRoot.insertBefore(line, this.chatRoot.firstChild);
    while (this.chatRoot.childElementCount > LOG.MAX_CHAT_ENTRIES) {
      const last = this.chatRoot.lastElementChild;
      if (last) last.remove();
    }
  }
}