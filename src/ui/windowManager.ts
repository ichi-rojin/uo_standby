// 責務: ドラッグ可能・×ボタン付き別窓ウインドウの生成と管理
const WINDOW_BG = 'rgba(20, 24, 32, 0.95)';
const WINDOW_BORDER = '#5a6a8a';

export type GameWindow = {
  el: HTMLDivElement;
  body: HTMLDivElement;
  close: () => void;
};

export class WindowManager {
  private readonly root: HTMLElement;
  private readonly windows: Set<HTMLDivElement> = new Set();
  private zCounter = 1000;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  create(title: string, width: number): GameWindow {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '120px';
    el.style.top = '80px';
    el.style.width = `${width}px`;
    el.style.maxHeight = '70vh';
    el.style.background = WINDOW_BG;
    el.style.border = `1px solid ${WINDOW_BORDER}`;
    el.style.borderRadius = '6px';
    el.style.color = '#e0e0e0';
    el.style.fontSize = '12px';
    el.style.zIndex = String(this.zCounter++);
    el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '6px 8px';
    header.style.background = '#2a3550';
    header.style.cursor = 'move';
    header.style.borderTopLeftRadius = '6px';
    header.style.borderTopRightRadius = '6px';
    header.style.flex = '0 0 auto';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    titleEl.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.background = '#803030';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '3px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.width = '20px';
    closeBtn.style.height = '20px';
    closeBtn.style.flex = '0 0 auto';

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.padding = '8px';
    body.style.overflowY = 'auto';
    body.style.flex = '1 1 auto';

    el.appendChild(header);
    el.appendChild(body);
    this.root.appendChild(el);
    this.windows.add(el);

    const close = (): void => {
      if (this.windows.has(el)) {
        this.root.removeChild(el);
        this.windows.delete(el);
      }
    };
    closeBtn.addEventListener('click', close);

    this.enableDrag(el, header);
    el.addEventListener('mousedown', () => {
      el.style.zIndex = String(this.zCounter++);
    });

    return { el, body, close };
  }

  private enableDrag(el: HTMLDivElement, handle: HTMLElement): void {
    let dragging = false;
    let offX = 0;
    let offY = 0;
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      dragging = true;
      offX = e.clientX - el.offsetLeft;
      offY = e.clientY - el.offsetTop;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!dragging) return;
      el.style.left = `${e.clientX - offX}px`;
      el.style.top = `${e.clientY - offY}px`;
    });
    window.addEventListener('mouseup', () => {
      dragging = false;
    });
  }
}