// 責務: ボスモンスターによる都市レイドの発生と人口減少
import { Rng } from '../util/rng';
import { dist } from '../util/math';
import { AI } from '../config/constants';
import type { Character } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_DEATH = 0xff5555;
const RAID_RANGE = 400;

export function maybeRaid(rng: Rng, state: GameState, boss: Character): void {
  if (boss.kind !== 'boss' || !boss.alive) return;
  if (!rng.chance(AI.RAID_CHANCE)) return;
  let nearestCity = state.cities[0];
  let bestD = Infinity;
  for (const city of state.cities) {
    const d = dist(boss.x, boss.y, city.x, city.y);
    if (d < bestD) {
      bestD = d;
      nearestCity = city;
    }
  }
  const loss = rng.int(5, 20);
  nearestCity.population = Math.max(0, nearestCity.population - loss);
  state.addEvent(`${displayName(boss)} が ${nearestCity.name} を襲撃 人口-${loss}`, COLOR_DEATH, [boss.id]);
  nearestCity.events.push({ stamp: '', text: `魔王の襲撃により人口-${loss}` });

  for (const c of state.characters.values()) {
    if (c.alive && c.kind === 'monster' && dist(c.x, c.y, boss.x, boss.y) < RAID_RANGE) {
      c.targetId = null;
      c.x += (nearestCity.x - c.x) * 0.3;
      c.y += (nearestCity.y - c.y) * 0.3;
    }
  }
}