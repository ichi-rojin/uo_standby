// File: src/ui/ChatLog.ts
// 責務: 右側に上からスタックする会話ログ。各行に×削除と関係キャラ追従リンクを持つ。

import { Character } from '../entities/Character';
import { LogConfig } from '../config/GameConfig';
import { EventLogClickHandler } from './EventLog';

export class ChatLog {
  public readonly root: HTMLDivElement;
  private readonly onCharClick: EventLogClickHandler;

  constructor(onCharClick: EventLogClickHandler) {
    this.onCharClick = onCharClick;
    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.right = '8px';
    this.root.style.top = '48px';
    this.root.style.width = '300px';
    this.root.style.maxHeight = '70%';
    this.root.style.overflowY = 'auto';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.gap = '4px';
    this.root.style.zIndex = '500';
  }

  public push(stamp: string, message: string, speaker: Character): void {
    const row = document.createElement('div');
    row.style.background = 'rgba(20,20,30,0.9)';
    row.style.border = '1px solid #40405a';
    row.style.borderRadius = '5px';
    row.style.padding = '5px 6px';
    row.style.fontSize = '11px';
    row.style.lineHeight = '1.4';
    row.style.color = LogConfig.COLOR_NORMAL;
    row.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '2px';
    closeBtn.style.right = '2px';
    closeBtn.style.background = '#b04040';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.width = '16px';
    closeBtn.style.height = '16px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.borderRadius = '3px';
    closeBtn.style.fontSize = '10px';
    closeBtn.addEventListener('click', () => row.remove());

    const name = document.createElement('span');
    name.textContent = speaker.kind === 'npc' ? speaker.fullName : '魔物';
    name.style.cursor = 'pointer';
    name.style.color = '#9fd0ff';
    name.style.fontWeight = 'bold';
    name.addEventListener('click', () => this.onCharClick(speaker));

    const msg = document.createElement('div');
    msg.textContent = `「${message}」`;

    const head = document.createElement('div');
    head.style.fontSize = '10px';
    head.style.color = '#909090';
    head.textContent = stamp;

    row.appendChild(closeBtn);
    row.appendChild(head);
    row.appendChild(name);
    row.appendChild(msg);

    this.root.insertBefore(row, this.root.firstChild);
    while (this.root.childElementCount > LogConfig.MAX_CHAT_LOG) {
      const last = this.root.lastElementChild;
      if (last) {
        last.remove();
      }
    }
  }
}