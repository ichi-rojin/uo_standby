// 責務: 会話ログの右側スタック表示。キャラクリックでコールバック・×で個別削除。

import { ConversationLog } from '../logging/ConversationLog';

export class ConversationLogPanel {
  readonly root: HTMLDivElement;

  constructor(
    private readonly log: ConversationLog,
    private readonly onCharacterClick: (id: number) => void
  ) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      right: '8px',
      top: '48px',
      width: '300px',
      maxHeight: '70vh',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
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
      const box = document.createElement('div');
      Object.assign(box.style, {
        background: 'rgba(16,16,24,0.9)',
        border: '1px solid #444',
        borderRadius: '5px',
        padding: '5px 6px',
        fontSize: '11px',
        position: 'relative',
      });

      const name = document.createElement('span');
      name.textContent = e.speakerName;
      name.style.color = '#88bbff';
      name.style.cursor = 'pointer';
      name.style.fontWeight = 'bold';
      name.addEventListener('click', () =>
        this.onCharacterClick(e.speakerId)
      );

      const text = document.createElement('div');
      text.textContent = `「${e.text}」`;
      text.style.marginTop = '2px';

      const close = document.createElement('button');
      close.textContent = '×';
      Object.assign(close.style, {
        position: 'absolute',
        top: '2px',
        right: '2px',
        cursor: 'pointer',
        background: '#822',
        color: '#fff',
        border: 'none',
        borderRadius: '3px',
        width: '16px',
        height: '16px',
        lineHeight: '14px',
        fontSize: '10px',
      });
      close.addEventListener('click', () => this.log.remove(e.id));

      box.appendChild(name);
      box.appendChild(text);
      box.appendChild(close);
      this.root.appendChild(box);
    }
  }
}