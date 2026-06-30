// 責務: 時間制御(停止/再生/2倍速)と時刻表示のツールバー
export type SpeedMode = 0 | 1 | 2;

export class Toolbar {
  private clockSpan: HTMLSpanElement;
  private buttons: HTMLButtonElement[] = [];
  mode: SpeedMode = 1;

  constructor(root: HTMLElement, onChange: (mode: SpeedMode) => void) {
    const bar = document.createElement('div');
    bar.className = 'toolbar';
    const defs: { label: string; mode: SpeedMode }[] = [
      { label: '⏸停止', mode: 0 },
      { label: '▶再生', mode: 1 },
      { label: '⏩2倍', mode: 2 }
    ];
    for (const d of defs) {
      const b = document.createElement('button');
      b.textContent = d.label;
      if (d.mode === this.mode) b.classList.add('active');
      b.addEventListener('click', () => {
        this.mode = d.mode;
        for (const bb of this.buttons) bb.classList.remove('active');
        b.classList.add('active');
        onChange(d.mode);
      });
      this.buttons.push(b);
      bar.appendChild(b);
    }
    this.clockSpan = document.createElement('span');
    this.clockSpan.style.marginLeft = '8px';
    bar.appendChild(this.clockSpan);
    root.appendChild(bar);
  }

  setClock(text: string): void {
    this.clockSpan.textContent = text;
  }
}