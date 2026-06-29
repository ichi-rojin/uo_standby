// src/ui/DraggableWindow.ts
// 責務: ドラッグ移動可能・×ボタンで閉じる別窓UI。×ボタンはスクロールから独立して不動。

import { applyStyle, basePanelStyle, UI_COLORS } from './uiStyles';

export class DraggableWindow {
  readonly root: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private dragging = false;
  private offsetX = 0;
  private offsetY = 0;

  constructor(title: string, parent: HTMLElement, x: number, y: number, width: number) {
    this.root = document.createElement('div');
    applyStyle(this.root, basePanelStyle());
    applyStyle(this.root, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      maxHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
    });

    const header = document.createElement('div');
    applyStyle(header, {
      position: 'relative',
      padding: '6px 28px 6px 10px',
      cursor: 'move',
      background: 'rgba(40,52,78,0.9)',
      borderTopLeftRadius: '6px',
      borderTopRightRadius: '6px',
      fontWeight: 'bold',
      userSelect: 'none',
    });
    header.textContent = title;

    const closeBtn = document.createElement('div');
    closeBtn.textContent = '×';
    applyStyle(closeBtn, {
      position: 'absolute',
      top: '4px',
      right: '6px',
      width: '18px',
      height: '18px',
      lineHeight: '18px',
      textAlign: 'center',
      cursor: 'pointer',
      color: UI_COLORS.death,
      fontWeight: 'bold',
    });
    closeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    closeBtn.addEventListener('pointerup', () => this.close());
    header.appendChild(closeBtn);

    this.body = document.createElement('div');
    applyStyle(this.body, {
      padding: '8px 10px',
      overflowY: 'auto',
      flex: '1 1 auto',
    });

    this.root.appendChild(header);
    this.root.appendChild(this.body);
    parent.appendChild(this.root);

    header.addEventListener('pointerdown', (e) => this.onDragStart(e));
    window.addEventListener('pointermove', this.onDragMove);
    window.addEventListener('pointerup', this.onDragEnd);
  }

  private onDragStart(e: PointerEvent): void {
    this.dragging = true;
    const rect = this.root.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
  }

  private onDragMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.root.style.left = `${e.clientX - this.offsetX}px`;
    this.root.style.top = `${e.clientY - this.offsetY}px`;
  };

  private onDragEnd = (): void => {
    this.dragging = false;
  };

  setBodyHtml(html: string): void {
    this.body.innerHTML = html;
  }

  appendToBody(el: HTMLElement): void {
    this.body.appendChild(el);
  }

  clearBody(): void {
    this.body.innerHTML = '';
  }

  close(): void {
    window.removeEventListener('pointermove', this.onDragMove);
    window.removeEventListener('pointerup', this.onDragEnd);
    this.root.remove();
  }
}