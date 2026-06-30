// 責務: 事件ログ・会話ログのDOM描画と相互作用
import type { EventLog } from '../sim/EventLog';
import type { LogColor } from '../sim/EventLog';

const COLOR_MAP: Record<LogColor, string> = {
  red: '#ff6666',
  green: '#66ff88',
  gold: '#ffcc33',
  yellow: '#ffff66',
  white: '#ccccdd'
};

export class LogPanel {
  private eventPanel: HTMLDivElement;
  private chatPanel: HTMLDivElement;

  constructor(
    root: HTMLElement,
    private readonly log: EventLog,
    private readonly onCharClick: (id: number) => void
  ) {
    this.eventPanel = document.createElement('div');
    this.eventPanel.className = 'log-panel';
    this.chatPanel = document.createElement('div');
    this.chatPanel.className = 'chat-panel';
    root.append(this.eventPanel, this.chatPanel);
    this.log.onEvent = () => this.renderEvents();
    this.log.onChat = () => this.renderChats();
    this.renderEvents();
    this.renderChats();
  }

  private renderEvents(): void {
    this.eventPanel.innerHTML = '';
    for (const e of this.log.getEvents()) {
      const line = document.createElement('div');
      line.className = 'log-line';
      line.style.color = COLOR_MAP[e.color];
      let html = e.text;
      this.eventPanel.appendChild(line);
      line.textContent = html;
      for (const id of e.charIds) {
        const lk = document.createElement('span');
        lk.className = 'lk';
        lk.textContent = ` [#${id}]`;
        lk.style.color = COLOR_MAP[e.color];
        lk.addEventListener('click', () => this.onCharClick(id));
        line.appendChild(lk);
      }
    }
  }

  private renderChats(): void {
    this.chatPanel.innerHTML = '';
    for (const c of this.log.getChats()) {
      const item = document.createElement('div');
      item.className = 'chat-item';
      const close = document.createElement('span');
      close.className = 'chat-close';
      close.textContent = '×';
      close.addEventListener('click', () => this.log.removeChat(c.id));
      const header = document.createElement('div');
      const fromLk = document.createElement('span');
      fromLk.className = 'lk';
      fromLk.textContent = c.fromName;
      fromLk.addEventListener('click', () => this.onCharClick(c.from));
      header.append('===========', document.createElement('br'), fromLk);
      if (c.to >= 0) {
        const toLk = document.createElement('span');
        toLk.className = 'lk';
        toLk.textContent = c.toName;
        const arrow = document.createElement('span');
        arrow.textContent = ' >>> ';
        toLk.addEventListener('click', () => this.onCharClick(c.to));
        header.append(arrow, toLk);
      }
      const txt = document.createElement('div');
      txt.textContent = c.text;
      const footer = document.createElement('div');
      footer.textContent = '===========';
      item.append(close, header, txt, footer);
      this.chatPanel.appendChild(item);
    }
  }
}