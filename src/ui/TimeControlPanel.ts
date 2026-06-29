// 責務: 時間ヘッダ(Y年m月d日 H時)表示と、停止/再生/2倍速ボタン。

import { GameClock, TimeScale } from '../core/GameClock';

export class TimeControlPanel {
  readonly root: HTMLDivElement;
  private readonly headerSpan: HTMLSpanElement;

  constructor(private readonly clock: GameClock) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      top: '8px',
      left: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(10,10,16,0.85)',
      border: '1px solid #444',
      borderRadius: '6px',
      padding: '6px 10px',
      zIndex: '600',
      fontSize: '13px',
    });

    this.headerSpan = document.createElement('span');
    this.headerSpan.style.minWidth = '180px';
    this.headerSpan.style.fontWeight = 'bold';
    this.root.appendChild(this.headerSpan);

    this.root.appendChild(this.makeButton('⏸ 停止', 0));
    this.root.appendChild(this.makeButton('▶ 再生', 1));
    this.root.appendChild(this.makeButton('⏩ 2倍速', 2));
  }

  private makeButton(label: string, scale: TimeScale): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      cursor: 'pointer',
      background: '#334',
      color: '#fff',
      border: '1px solid #556',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
    });
    btn.addEventListener('click', () => this.clock.setScale(scale));
    return btn;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
  }

  update(): void {
    this.headerSpan.textContent = this.clock.formatHeader();
  }
}