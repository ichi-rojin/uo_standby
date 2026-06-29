// src/ui/TimeControlPanel.ts
// 責務: 日時表示と時間停止／再生／2倍速ボタンを提供する。

import { applyStyle, basePanelStyle } from './uiStyles';
import { SPEED } from '../config/constants';

export type SpeedChangeHandler = (speed: number) => void;

export class TimeControlPanel {
  private readonly dateLabel: HTMLDivElement;

  constructor(parent: HTMLElement, onSpeedChange: SpeedChangeHandler) {
    const root = document.createElement('div');
    applyStyle(root, basePanelStyle());
    applyStyle(root, {
      left: '10px',
      top: '10px',
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minWidth: '240px',
    });

    this.dateLabel = document.createElement('div');
    applyStyle(this.dateLabel, { fontWeight: 'bold', fontSize: '15px' });
    this.dateLabel.textContent = '---';
    root.appendChild(this.dateLabel);

    const btnRow = document.createElement('div');
    applyStyle(btnRow, { display: 'flex', gap: '6px' });

    btnRow.appendChild(this.makeButton('⏸ 停止', () => onSpeedChange(SPEED.PAUSED)));
    btnRow.appendChild(this.makeButton('▶ 再生', () => onSpeedChange(SPEED.NORMAL)));
    btnRow.appendChild(this.makeButton('⏩ 2倍', () => onSpeedChange(SPEED.FAST)));

    root.appendChild(btnRow);
    parent.appendChild(root);
  }

  private makeButton(label: string, handler: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    applyStyle(btn, {
      background: '#2a3550',
      color: '#fff',
      border: '1px solid #4a5a7a',
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '13px',
    });
    btn.addEventListener('click', handler);
    return btn;
  }

  setDateText(text: string): void {
    this.dateLabel.textContent = text;
  }
}