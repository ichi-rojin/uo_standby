// 責務: 都市詳細ウインドウ(人口/滞在NPC/クエスト/出来事・ドラッグ可・×不動)
import type { Place } from '../entities/place';
import type { Character } from '../entities/character';

export class CityWindow {
  el: HTMLDivElement;
  private body: HTMLDivElement;

  constructor(root: HTMLElement, p: Place, resolveName: (id: number) => Character | undefined, onClose: () => void) {
    this.el = document.createElement('div');
    const s = this.el.style;
    s.position = 'absolute';
    s.top = '100px';
    s.left = '120px';
    s.width = '300px';
    s.maxHeight = '60vh';
    s.background = 'rgba(20,20,15,0.95)';
    s.border = '1px solid #aa8844';
    s.borderRadius = '6px';
    s.color = '#eee';
    s.fontSize = '12px';
    s.zIndex = '50';

    const header = document.createElement('div');
    header.style.cursor = 'move';
    header.style.background = '#443a22';
    header.style.padding = '4px 8px';
    header.style.position = 'relative';
    header.textContent = p.name;
    const close = document.createElement('span');
    close.textContent = '×';
    close.style.position = 'absolute';
    close.style.right = '6px';
    close.style.top = '2px';
    close.style.cursor = 'pointer';
    close.onclick = () => onClose();
    header.appendChild(close);

    this.body = document.createElement('div');
    this.body.style.padding = '8px';
    this.body.style.overflowY = 'auto';
    this.body.style.maxHeight = '50vh';

    this.el.appendChild(header);
    this.el.appendChild(this.body);
    root.appendChild(this.el);
    this.makeDraggable(header);
    this.render(p, resolveName);
  }

  private makeDraggable(handle: HTMLElement): void {
    let dragging = false;
    let ox = 0;
    let oy = 0;
    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      const rect = this.el.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.el.style.left = `${e.clientX - ox}px`;
      this.el.style.top = `${e.clientY - oy}px`;
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  render(p: Place, resolveName: (id: number) => Character | undefined): void {
    let html = `<div>人口: ${p.population}</div>`;
    html += `<div>滞在NPC: ${p.presentNpcIds.size}</div><hr/>`;
    html += '<div style="color:#ffcc88">滞在一覧</div>';
    for (const id of p.presentNpcIds) {
      const c = resolveName(id);
      if (c) html += `<div>${c.fullName()}</div>`;
    }
    html += '<hr/><div style="color:#ffcc88">発注クエスト</div>';
    for (const q of p.quests) {
      const status = q.done === null ? '進行中' : q.done ? '達成' : '失敗';
      html += `<div>${q.desc} / ${q.takerName} / ${status}</div>`;
    }
    html += '<hr/><div style="color:#ffcc88">都市内出来事</div>';
    for (const e of p.events.slice(-10).reverse()) {
      html += `<div>${e}</div>`;
    }
    this.body.innerHTML = html;
  }
}