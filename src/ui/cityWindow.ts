// 責務: 都市詳細ウインドウ（人口・滞在NPC・クエスト・出来事）の構築
import { WindowManager } from './windowManager';
import { displayName } from '../systems/combatSystem';
import type { City } from '../domain/types';
import type { GameState } from '../state/gameState';

export function openCityWindow(
  wm: WindowManager,
  state: GameState,
  city: City,
  onPickCharacter: (id: number) => void,
): void {
  const win = wm.create(`都市: ${city.name}`, 300);

  const head = document.createElement('div');
  head.innerHTML =
    `<b>${city.name}</b><br>人口: ${city.population} / 防衛力: ${city.defense}<br>` +
    `滞在NPC: ${city.residents.length} / 子供: ${city.children.length}`;
  win.body.appendChild(head);

  const resTitle = document.createElement('div');
  resTitle.textContent = '― 滞在NPC ―';
  resTitle.style.marginTop = '6px';
  resTitle.style.color = '#aac';
  win.body.appendChild(resTitle);

  for (const id of city.residents.slice(0, 30)) {
    const c = state.characters.get(id);
    if (!c) continue;
    const line = document.createElement('div');
    line.textContent = displayName(c);
    line.style.cursor = 'pointer';
    line.style.color = '#9cf';
    line.style.padding = '2px 0';
    line.addEventListener('click', () => onPickCharacter(id));
    win.body.appendChild(line);
  }

  const qTitle = document.createElement('div');
  qTitle.textContent = '― 発注クエスト ―';
  qTitle.style.marginTop = '6px';
  qTitle.style.color = '#aac';
  win.body.appendChild(qTitle);

  for (const q of city.quests) {
    const accepted = q.acceptedBy !== null ? state.characters.get(q.acceptedBy) : null;
    const line = document.createElement('div');
    line.textContent =
      `${q.description} 報酬${q.reward} ` +
      `${accepted ? `受託:${displayName(accepted)} ${q.done ? '達成' : '進行中'}` : '未受託'}`;
    line.style.padding = '2px 0';
    win.body.appendChild(line);
  }

  const eTitle = document.createElement('div');
  eTitle.textContent = '― 都市内出来事 ―';
  eTitle.style.marginTop = '6px';
  eTitle.style.color = '#aac';
  win.body.appendChild(eTitle);

  for (let i = city.events.length - 1; i >= 0 && i > city.events.length - 16; i--) {
    const line = document.createElement('div');
    line.textContent = `${city.events[i].stamp}${city.events[i].text}`;
    line.style.padding = '2px 0';
    win.body.appendChild(line);
  }
}