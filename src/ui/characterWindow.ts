// 責務: キャラクター詳細ウインドウ（能力値・履歴・回復/復活ボタン）の構築
import { WindowManager } from './windowManager';
import { displayName } from '../systems/combatSystem';
import { recoverAtSafe } from '../systems/needsSystem';
import { clamp } from '../util/math';
import { DEAD, STAT } from '../config/constants';
import type { Character } from '../domain/types';

export function openCharacterWindow(
  wm: WindowManager,
  c: Character,
  onFollow: (id: number) => void,
): void {
  const win = wm.create(displayName(c), 280);
  onFollow(c.id);

  const sexLabel = c.sex === 'male' ? '男性' : '女性';
  const stats = c.stats;

  const info = document.createElement('div');
  info.innerHTML =
    `<b>${displayName(c)}</b> (${sexLabel})<br>` +
    `種別: ${c.kind} / 武器: ${c.inventory.weapon}<br>` +
    `HP: ${Math.round(stats.hp)}/${stats.hpMax} MP: ${Math.round(stats.mp)}/${stats.mpMax}<br>` +
    `健康度: ${Math.round(stats.health)}<br>` +
    `力: ${stats.power} 瞬発: ${stats.agility} 反応: ${stats.reaction}<br>` +
    `知覚: ${stats.perception} 巧緻: ${stats.dexterity} 魔法: ${stats.magic}<br>` +
    `名誉: ${stats.honor} モラル: ${stats.moral}<br>` +
    `経験値: ${c.experience} 金銭: ${c.inventory.money} 食料: ${c.inventory.food}<br>` +
    `食欲:${Math.round(c.needs.food)} 睡眠:${Math.round(c.needs.sleep)} 性欲:${Math.round(c.needs.libido)}<br>` +
    `スキル: ${c.skills.spells.join(',') || 'なし'} / ${c.skills.specials.join(',') || 'なし'}`;
  win.body.appendChild(info);

  const btn = document.createElement('button');
  btn.style.margin = '8px 0';
  btn.style.padding = '4px 10px';
  btn.style.cursor = 'pointer';
  if (c.alive) {
    btn.textContent = '回復';
    btn.addEventListener('click', () => {
      c.stats.hp = c.stats.hpMax;
      c.stats.mp = c.stats.mpMax;
      recoverAtSafe(c);
      info.querySelectorAll('br');
    });
  } else {
    btn.textContent = '復活';
    btn.addEventListener('click', () => {
      c.alive = true;
      c.deadTicks = 0;
      c.stats.hp = c.stats.hpMax;
      c.stats.mp = c.stats.mpMax;
      c.stats.health = clamp(STAT.MAX, 0, STAT.MAX);
      c.deadTicks = DEAD.GRAYSCALE_TICKS;
      win.close();
    });
  }
  win.body.appendChild(btn);

  const histTitle = document.createElement('div');
  histTitle.textContent = '― 履歴 ―';
  histTitle.style.marginTop = '6px';
  histTitle.style.color = '#aac';
  win.body.appendChild(histTitle);

  const histList = document.createElement('div');
  for (let i = c.history.length - 1; i >= 0; i--) {
    const h = c.history[i];
    const line = document.createElement('div');
    line.textContent = `${h.stamp}${h.text}`;
    line.style.borderBottom = '1px solid #333';
    line.style.padding = '2px 0';
    histList.appendChild(line);
  }
  if (c.history.length === 0) {
    const line = document.createElement('div');
    line.textContent = '履歴なし';
    histList.appendChild(line);
  }
  win.body.appendChild(histList);
}