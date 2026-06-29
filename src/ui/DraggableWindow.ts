// 責務: ドラッグ移動可能・×ボタンで閉じる別窓ウインドウの基底。
// ×ボタンはスクロールから独立して不動(ヘッダ固定/本文のみスクロール)。

export class DraggableWindow {
  readonly root: HTMLDivElement;
  private readonly header: HTMLDivElement;
  protected readonly body: HTMLDivElement;
  private dragging = false;
  private offsetX = 0;
  private offsetY = 0;
  private onClose: (() => void) | null = null;

  constructor(title: string, width: number, height: number) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      left: '120px',
      top: '120px',
      width: `${width}px`,
      height: `${height}px`,
      background: 'rgba(20,20,28,0.96)',
      border: '1px solid #555',
      borderRadius: '6px',
      boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: '1000',
      color: '#eee',
      fontSize: '12px',
    });

    this.header = document.createElement('div');
    Object.assign(this.header.style, {
      cursor: 'move',
      padding: '6px 8px',
      background: 'rgba(40,40,60,0.98)',
      borderBottom: '1px solid #555',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      userSelect: 'none',
      flex: '0 0 auto',
    });
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleSpan.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      cursor: 'pointer',
      background: '#822',
      color: '#fff',
      border: 'none',
      borderRadius: '3px',
      width: '20px',
      height: '20px',
      lineHeight: '18px',
      flex: '0 0 auto',
    });
    closeBtn.addEventListener('click', () => this.close());

    this.header.appendChild(titleSpan);
    this.header.appendChild(closeBtn);

    this.body = document.createElement('div');
    Object.assign(this.body.style, {
      padding: '8px',
      overflowY: 'auto',
      flex: '1 1 auto',
    });

    this.root.appendChild(this.header);
    this.root.appendChild(this.body);

    this.attachDrag();
  }

  private attachDrag(): void {
    this.header.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.offsetX = e.clientX - this.root.offsetLeft;
      this.offsetY = e.clientY - this.root.offsetTop;
      this.header.setPointerCapture(e.pointerId);
    });
    this.header.addEventListener('pointermove', (e) => {
      if (this.dragging) {
        this.root.style.left = `${e.clientX - this.offsetX}px`;
        this.root.style.top = `${e.clientY - this.offsetY}px`;
      }
    });
    this.header.addEventListener('pointerup', (e) => {
      this.dragging = false;
      this.header.releasePointerCapture(e.pointerId);
    });
  }

  setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
  }

  close(): void {
    if (this.onClose) {
      this.onClose();
    }
    this.root.remove();
  }

  setPosition(x: number, y: number): void {
    this.root.style.left = `${x}px`;
    this.root.style.top = `${y}px`;
  }
}