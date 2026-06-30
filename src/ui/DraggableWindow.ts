// File: src/ui/DraggableWindow.ts
// 責務: ドラッグ移動可能でスクロール独立の×ボタンを持つ汎用DOMウインドウ。

export class DraggableWindow {
  public readonly root: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private dragging: boolean;
  private dragOffsetX: number;
  private dragOffsetY: number;
  private onClose: (() => void) | null;

  constructor(title: string, width: number, height: number) {
    this.dragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.onClose = null;

    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.width = `${width}px`;
    this.root.style.maxHeight = `${height}px`;
    this.root.style.background = 'rgba(20,20,28,0.96)';
    this.root.style.border = '1px solid #50506a';
    this.root.style.borderRadius = '6px';
    this.root.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
    this.root.style.zIndex = '1000';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.fontSize = '12px';
    this.root.style.color = '#e8e8e8';

    this.header = document.createElement('div');
    this.header.style.display = 'flex';
    this.header.style.justifyContent = 'space-between';
    this.header.style.alignItems = 'center';
    this.header.style.padding = '6px 8px';
    this.header.style.background = '#2a2a3a';
    this.header.style.cursor = 'move';
    this.header.style.borderTopLeftRadius = '6px';
    this.header.style.borderTopRightRadius = '6px';
    this.header.style.flex = '0 0 auto';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    titleEl.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.background = '#b04040';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.width = '20px';
    closeBtn.style.height = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.borderRadius = '3px';
    closeBtn.style.flex = '0 0 auto';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.header.appendChild(titleEl);
    this.header.appendChild(closeBtn);

    this.body = document.createElement('div');
    this.body.style.padding = '8px';
    this.body.style.overflowY = 'auto';
    this.body.style.flex = '1 1 auto';

    this.root.appendChild(this.header);
    this.root.appendChild(this.body);

    this.header.addEventListener('pointerdown', (e) => this.startDrag(e));
    window.addEventListener('pointermove', (e) => this.onDrag(e));
    window.addEventListener('pointerup', () => this.endDrag());
  }

  public setPosition(x: number, y: number): void {
    this.root.style.left = `${x}px`;
    this.root.style.top = `${y}px`;
  }

  public setContent(html: string): void {
    this.body.innerHTML = html;
  }

  public getBody(): HTMLDivElement {
    return this.body;
  }

  public setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  public close(): void {
    if (this.onClose) {
      this.onClose();
    }
    this.root.remove();
  }

  private startDrag(e: PointerEvent): void {
    this.dragging = true;
    const rect = this.root.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
  }

  private onDrag(e: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.root.style.left = `${e.clientX - this.dragOffsetX}px`;
    this.root.style.top = `${e.clientY - this.dragOffsetY}px`;
  }

  private endDrag(): void {
    this.dragging = false;
  }
}