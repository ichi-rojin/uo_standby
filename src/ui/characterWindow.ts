// 責務: キャラ詳細ウインドウ(ドラッグ可/×不動/回復・復活ボタン/履歴)
import type { Character } from '../entities/character';
import type { TimeSystem } from '../core/timeSystem';

export interface WindowCallbacks {
  onHeal: (c: Character) => void;
  onRevive: (c: Character) => void;
  onCamera: (c: Character) => void;
  onClose: () => void;
}

export class CharacterWindow {
  el: HTMLDivElement;
  private body: HTMLDivElement;

  constructor(root: HTMLElement, c: Character, time: TimeSystem, cb: WindowCallbacks) {
    this.el = document.createElement('div');
    const s = this.el.style;
    s.position = 'absolute';
    s.top = '80px';
    s.left = '50%';
    s.width = '320px';
    s.maxHeight = '70vh';
    s.background = 'rgba(15,15,30,0.95)';
    s.border = '1px solid #5577aa';
    s.borderRadius = '6px';
    s.color = '#eee';
    s.fontSize = '12px';
    s.zIndex = '50';

    const header = document.createElement('div');
    header.style.cursor = 'move';
    header.style.background = '#2a2a44';
    header.style.padding = '4px 8px';
    header.style.position = 'relative';
    header.textContent = c.kind === 'monster' ? `${c.title} #${c.id}` : c.fullName();

    const close = document.createElement('span');
    close.textContent = '×';
    close.style.position = 'absolute';
    close.style.right = '6px';
    close.style.top = '2px';
    close.style.cursor = 'pointer';
    close.onclick = () => cb.onClose();
    header.appendChild(close);

    this.body = document.createElement('div');
    this.body.style.padding = '8px';
    this.body.style.overflowY = 'auto';
    this.body.style.maxHeight = '56vh';

    const actions = document.createElement('div');
    actions.style.padding = '6px 8px';
    if (c.alive) {
      const heal = document.createElement('button');
      heal.textContent = '回復';
      heal.style.cursor = 'pointer';
      heal.onclick = () => { cb.onHeal(c); this.render(c, time); };
      actions.appendChild(heal);
    } else {
      const rev = document.createElement('button');
      rev.textContent = '復活';
      rev.style.cursor = 'pointer';
      rev.onclick = () => { cb.onRevive(c); this.render(c, time); };
      actions.appendChild(rev);
    }
    const cam = document.createElement('button');
    cam.textContent = 'カメラ追従';
    cam.style.cursor = 'pointer';
    cam.style.marginLeft = '6px';
    cam.onclick = () => cb.onCamera(c);
    actions.appendChild(cam);

    this.el.appendChild(header);
    this.el.appendChild(actions);
    this.el.appendChild(this.body);
    root.appendChild(this.el);
    this.makeDraggable(header);
    this.render(c, time);
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
      this.el.style.left = `${rect.left}px`;
      this.el.style.top = `${rect.top}px`;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.el.style.left = `${e.clientX - ox}px`;
      this.el.style.top = `${e.clientY - oy}px`;
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  render(c: Character, time: TimeSystem): void {
    const a = c.ab;
    const rows: string[] = [];
    rows.push(`性別: ${c.gender === 'male' ? '男性' : '女性'}`);
    rows.push(`状態: ${c.alive ? '生存' : '死亡'}`);
    rows.push(`HP: ${Math.round(a.hp)}/${a.maxHp} MP: ${Math.round(a.mp)}/${a.maxMp}`);
    rows.push(`健康度: ${Math.round(a.health)}`);
    rows.push(`力:${a.power} 瞬発:${a.agility} 反応:${a.reaction} 知覚:${a.perception}`);
    rows.push(`巧緻:${a.dexterity} 魔法:${a.magic} 名誉:${a.honor} モラル:${a.moral}`);
    rows.push(`武器: ${c.inv.weapon} 食料:${c.inv.food} 金銭:${c.inv.money} 財宝:${c.inv.valuables}`);
    rows.push(`剣${c.skills.swordSkill} 弓${c.skills.bowSkill} 攻魔${c.skills.magicAttack} 治魔${c.skills.magicHeal}`);
    rows.push(`夜盗:${c.isBandit ? 'はい' : 'いいえ'} 都市帰属:${c.cityAttachment.toFixed(2)}`);
    let html = rows.map((r) => `<div>${r}</div>`).join('');
    html += '<hr/><div style="color:#aaccff">履歴</div>';
    const hist = c.history.slice(-30).reverse();
    for (const h of hist) {
      html += `<div style="margin-bottom:2px">${time.formatAtTick(h.tick)}に${h.text}</div>`;
    }
    this.body.innerHTML = html;
  }
}