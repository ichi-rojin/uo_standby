// 責務: ドラッグ可能ウィンドウ(キャラ詳細・都市詳細)のDOM生成と操作
import type { Simulation } from '../sim/Simulation';
import type { Character } from '../domain/types';

export type FocusRequest = (id: number) => void;

function makeDraggable(win: HTMLDivElement, head: HTMLDivElement): void {
  let dragging = false;
  let ox = 0;
  let oy = 0;
  head.addEventListener('mousedown', (e) => {
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    win.style.left = `${e.clientX - ox}px`;
    win.style.top = `${e.clientY - oy}px`;
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
  });
}

export class WindowManager {
  private root: HTMLElement;
  constructor(
    root: HTMLElement,
    private readonly sim: Simulation,
    private readonly focus: FocusRequest
  ) {
    this.root = root;
  }

  private frame(title: string): { win: HTMLDivElement; body: HTMLDivElement } {
    const win = document.createElement('div');
    win.className = 'win';
    win.style.left = `${120 + Math.random() * 200}px`;
    win.style.top = `${80 + Math.random() * 160}px`;
    win.style.width = '300px';
    const head = document.createElement('div');
    head.className = 'win-head';
    const t = document.createElement('span');
    t.className = 'win-title';
    t.textContent = title;
    const close = document.createElement('span');
    close.className = 'win-close';
    close.textContent = '×';
    close.addEventListener('click', () => win.remove());
    head.append(t, close);
    const body = document.createElement('div');
    body.className = 'win-body';
    win.append(head, body);
    makeDraggable(win, head);
    this.root.appendChild(win);
    return { win, body };
  }

  openCharacter(id: number): void {
    const c = this.sim.chars.get(id);
    if (!c) return;
    const { body } = this.frame(`${this.sim.name(c)}`);
    this.renderCharBody(body, c);
  }

  private renderCharBody(body: HTMLDivElement, c: Character): void {
    body.innerHTML = '';
    const s = c.stats;
    const info = document.createElement('div');
    const genderTxt = c.gender === 'male' ? '男性' : '女性';
    info.innerHTML =
      `種別:${c.kind} 性別:${genderTxt} ${c.evil ? '【悪徳】' : ''}<br>` +
      `通り名:${c.title}<br>姓名:${c.surname}・${c.givenName}<br>` +
      `HP:${Math.floor(s.hp)}/${s.maxHp} MP:${Math.floor(s.mp)}/${s.maxMp}<br>` +
      `健康:${Math.floor(s.health)} 力:${s.power} 瞬発:${s.agility} 反応:${s.reflex}<br>` +
      `知覚:${s.perception} 巧緻:${s.dexterity} 魔法:${s.magic}<br>` +
      `名誉:${s.honor} モラル:${s.moral}<br>` +
      `武器:${c.inventory.weapon} 食料:${c.inventory.food} 財宝:${c.inventory.treasures} 金:${c.inventory.gold}<br>` +
      `帰属度:${c.cityAttachment.toFixed(2)} 状態:${c.state}<br>` +
      `スキル: 剣${c.skills.weaponSword} 槍${c.skills.weaponPole} 弓${c.skills.weaponBow} ` +
      `魔攻${c.skills.magicAttack} 回復${c.skills.magicHeal} 必殺${c.skills.special}`;
    body.appendChild(info);

    const btn = document.createElement('button');
    btn.className = c.alive ? 'win-btn' : 'win-btn revive';
    btn.textContent = c.alive ? '回復' : '復活';
    btn.addEventListener('click', () => {
      if (c.alive) this.sim.fullHeal(c.id);
      else this.sim.revive(c.id);
      this.renderCharBody(body, c);
    });
    body.appendChild(btn);

    const focusBtn = document.createElement('button');
    focusBtn.className = 'win-btn';
    focusBtn.textContent = 'カメラ追従';
    focusBtn.addEventListener('click', () => this.focus(c.id));
    body.appendChild(focusBtn);

    const hist = document.createElement('div');
    hist.style.marginTop = '6px';
    hist.innerHTML = '<b>履歴</b><br>' + c.history.map((h) => `${h.stamp}${h.text}`).join('<br>');
    body.appendChild(hist);

    // 選択でカメラ追従(生存/死亡問わずマップ存在時)
    this.focus(c.id);
  }

  openCity(id: number): void {
    const city = this.sim.world.cities[id];
    if (!city) return;
    const { body } = this.frame(`都市: ${city.name}`);
    const stay = this.sim.cityStayCount(id);
    const quests = city.quests.length
      ? city.quests.map((q) => `・${q.text} 受託:${q.acceptedBy >= 0 ? q.acceptedBy : '未'} ${q.done ? '達成' : '進行中'}`).join('<br>')
      : '(発注なし)';
    const events = city.events.length
      ? city.events.map((e) => `${e.stamp}${e.text}`).join('<br>')
      : '(なし)';
    body.innerHTML =
      `人口:${city.population} 滞在NPC:${stay}<br>` +
      `保管中の子:${city.storedChildren.length}<br>` +
      `<b>クエスト</b><br>${quests}<br><b>出来事</b><br>${events}`;
  }
}