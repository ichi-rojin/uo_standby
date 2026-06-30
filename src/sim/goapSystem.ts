// 責務: ゴールベースの行動選択(簡易GOAP・第1便基盤)
import type { Character } from '../entities/character';
import type { Place } from '../entities/place';
import type { GoalType } from '../domain/types';

function nearestPlace(c: Character, places: Place[]): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of places) {
    if (p.decayed) continue;
    const dx = p.pos.x - c.pos.x;
    const dy = p.pos.y - c.pos.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

export function chooseGoal(c: Character, cities: Place[]): GoalType {
  if (c.ab.hp < c.ab.maxHp * 0.3 || c.needs.hunger > 80) {
    const city = nearestPlace(c, cities);
    if (city) { c.targetPos = { ...city.pos }; return 'goCity'; }
  }
  if (c.isBandit && c.needs.greed > 60) {
    return 'banditRaid';
  }
  if (c.needs.lust > 75 && c.kind === 'npc') {
    return 'mate';
  }
  if (c.needs.growth > 50 || c.kind === 'monster') {
    return 'hunt';
  }
  return 'wander';
}