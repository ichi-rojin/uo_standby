// 責務: 事件・出来事ログの左下固定表示。色種別反映・キャラクリックでコールバック。

import { EventLog } from '../logging/EventLog';
import { LogColorKey } from '../domain/types';

const COLOR_MAP: Record<LogColorKey, string> = {
  death: '#ff5555',
  relation: '#55dd66',
  treasure: '#ffcc33',
  money: '#ffee55',
  normal: '#dddddd',
};

export class EventLogPanel {
  readonly root: HTMLDivElement;

  constructor(
    private readonly log: EventLog,
    private readonly onCharacterClick: (id: number) => void
  ) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      left: '8px',
      bottom: '8px',
      width: '420px',
      height: '230px',
      background: 'rgba(10,10,16,0.82)',
      border: '1px solid #444',
      borderRadius: '6px',
      overflowY: 'auto',
      padding: '6px',
      fontSize: '11px',
      lineHeight: '1.45',
      zIndex: '500',
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
  }

  update(): void {
    if (!this.log.consumeDirty()) {
      return;
    }
    this.root.innerHTML = '';
    const entries = this.log.getEntries();
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      const line = document.createElement('div');
      line.style.color = COLOR_MAP[e.color];
      line.style.margin = '1px 0';
      line.textContent = e.text;

      for (const id of e.relatedCharacterIds) {
        const btn = document.createElement('span');
        btn.textContent = ` [#${id}]`;
        btn.style.cursor = 'pointer';
        btn.style.color = '#88bbff';
        btn.addEventListener('click', () => this.onCharacterClick(id));
        line.appendChild(btn);
      }
      this.root.appendChild(line);
    }
  }
}