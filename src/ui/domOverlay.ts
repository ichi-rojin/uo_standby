// 責務: HTML上のUI(時計/速度ボタン/ログ/会話ログ)の生成と更新
import { TIME as _TIME } from '../config/constants';
import { LogSystem } from './logSystem';
import type { EventLogItem, TalkLogItem } from './logSystem';

void _TIME;

export type SpeedMode = 'pause' | 'play' | 'fast';

export class DomOverlay {
  private clock: HTMLDivElement;
  private eventPanel: HTMLDivElement;
  private talkPanel: HTMLDivElement;
  onSpeedChange: ((m: SpeedMode) => void) | null = null;
  onCharClick: ((id: number) => void) | null = null;
  onTalkClose: ((id: number) => void) | null = null;

  constructor(root: HTMLElement) {
    this.clock = this.makeClock(root);
    this.makeControls(root);
    this.eventPanel = this.makeEventPanel(root);
    this.talkPanel = this.makeTalkPanel(root);
  }

  private base(el: HTMLElement): void {
    el.style.position = 'absolute';
    el.style.color = '#eee';
    el.style.fontFamily = 'sans-serif';
    el.style.zIndex = '10';
  }

  private makeClock(root: HTMLElement): HTMLDivElement {
    const d = document.createElement('div');
    this.base(d);
    d.style.top = '8px';
    d.style.left = '8px';
    d.style.fontSize = '16px';
    d.style.background = 'rgba(0,0,0,0.5)';
    d.style.padding = '4px 8px';
    d.style.borderRadius = '4px';
    root.appendChild(d);
    return d;
  }

  private makeControls(root: HTMLElement): void {
    const bar = document.createElement('div');
    this.base(bar);
    bar.style.top = '8px';
    bar.style.left = '220px';
    const mk = (label: string, m: SpeedMode): void => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.marginRight = '4px';
      b.style.cursor = 'pointer';
      b.onclick = () => { if (this.onSpeedChange) this.onSpeedChange(m); };
      bar.appendChild(b);
    };
    mk('⏸停止', 'pause');
    mk('▶再生', 'play');
    mk('⏩2倍', 'fast');
    root.appendChild(bar);
  }

  private makeEventPanel(root: HTMLElement): HTMLDivElement {
    const d = document.createElement('div');
    this.base(d);
    d.style.bottom = '8px';
    d.style.left = '8px';
    d.style.width = '380px';
    d.style.maxHeight = '40vh';
    d.style.overflowY = 'auto';
    d.style.background = 'rgba(0,0,0,0.55)';
    d.style.padding = '6px';
    d.style.borderRadius = '4px';
    d.style.fontSize = '12px';
    root.appendChild(d);
    return d;
  }

  private makeTalkPanel(root: HTMLElement): HTMLDivElement {
    const d = document.createElement('div');
    this.base(d);
    d.style.top = '48px';
    d.style.right = '8px';
    d.style.width = '300px';
    d.style.maxHeight = '70vh';
    d.style.overflowY = 'auto';
    d.style.fontSize = '12px';
    root.appendChild(d);
    return d;
  }

  setClock(text: string): void {
    this.clock.textContent = text;
  }

  renderEvents(items: EventLogItem[]): void {
    this.eventPanel.innerHTML = '';
    for (const it of items) {
      const row = document.createElement('div');
      row.style.color = LogSystem.colorOf(it.category);
      row.style.marginBottom = '2px';
      row.style.cursor = it.charIds.length > 0 ? 'pointer' : 'default';
      row.textContent = it.text;
      if (it.charIds.length > 0) {
        row.onclick = () => { if (this.onCharClick) this.onCharClick(it.charIds[0]); };
      }
      this.eventPanel.appendChild(row);
    }
  }

  renderTalks(items: TalkLogItem[]): void {
    this.talkPanel.innerHTML = '';
    for (const it of items) {
      const box = document.createElement('div');
      box.style.background = 'rgba(20,20,40,0.8)';
      box.style.marginBottom = '4px';
      box.style.padding = '4px';
      box.style.borderRadius = '4px';
      box.style.position = 'relative';
      const sp = document.createElement('div');
      sp.style.color = '#88ccff';
      sp.style.cursor = 'pointer';
      sp.textContent = it.speaker;
      sp.onclick = () => { if (this.onCharClick) this.onCharClick(it.speakerId); };
      const tx = document.createElement('div');
      tx.style.color = '#eee';
      tx.textContent = it.text;
      const close = document.createElement('span');
      close.textContent = '×';
      close.style.position = 'absolute';
      close.style.top = '2px';
      close.style.right = '4px';
      close.style.cursor = 'pointer';
      close.onclick = () => { if (this.onTalkClose) this.onTalkClose(it.id); };
      box.appendChild(sp);
      box.appendChild(tx);
      box.appendChild(close);
      this.talkPanel.appendChild(box);
    }
  }
}