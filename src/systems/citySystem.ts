// 責務: 都市の回復・防衛力/人口相関・滞在NPCの整備、村の補給
import { dist } from '../util/math';
import { RENDER } from '../config/constants';
import { recoverAtSafe } from './needsSystem';
import type { Character } from '../domain/types';
import type { GameState } from '../state/gameState';

const REST_RADIUS = RENDER.CITY_RADIUS + 20;
const VILLAGE_REST_RADIUS = RENDER.VILLAGE_RADIUS + 16;
const DEFENSE_PER_POP = 0.2;
const POP_DECAY_TICKS = 100;

export function updateCities(state: GameState): void {
  for (const city of state.cities) {
    city.defense = Math.round(10 + city.population * DEFENSE_PER_POP);
    if (state.tick % POP_DECAY_TICKS === 0) {
      const monstersNear = countMonstersNear(state, city.x, city.y, 400);
      if (monstersNear > 0) {
        city.population = Math.max(0, city.population - monstersNear);
      }
    }
  }
}

function countMonstersNear(state: GameState, x: number, y: number, radius: number): number {
  let n = 0;
  for (const c of state.characters.values()) {
    if (c.alive && c.kind === 'monster' && dist(x, y, c.x, c.y) <= radius) n++;
  }
  return n;
}

export function tryRestAtSafe(state: GameState, c: Character): boolean {
  if (c.kind === 'monster' || c.kind === 'boss') return false;
  for (const city of state.cities) {
    if (dist(c.x, c.y, city.x, city.y) <= REST_RADIUS) {
      recoverAtSafe(c);
      return true;
    }
  }
  for (const v of state.villages) {
    if (dist(c.x, c.y, v.x, v.y) <= VILLAGE_REST_RADIUS) {
      recoverAtSafe(c);
      return true;
    }
  }
  if (c.fortId !== null) {
    const fort = state.fortById(c.fortId);
    if (fort && dist(c.x, c.y, fort.x, fort.y) <= REST_RADIUS) {
      recoverAtSafe(c);
      return true;
    }
  }
  return false;
}

export function spendExperience(c: Character): void {
  if (c.experience < 5) return;
  c.experience -= 5;
  const choice = (c.id + c.experience) % 4;
  if (choice === 0) c.stats.power += 1;
  else if (choice === 1) c.stats.magic += 1;
  else if (choice === 2) c.stats.agility += 1;
  else c.stats.reaction += 1;
  c.history.push({ stamp: '', text: '能力が1上がった' });
}

export function applyCityDefenseDamage(state: GameState): void {
  for (const city of state.cities) {
    if (city.defense <= 0) continue;
    for (const c of state.characters.values()) {
      if (!c.alive || c.kind !== 'monster') continue;
      if (dist(c.x, c.y, city.x, city.y) <= REST_RADIUS + 40) {
        c.stats.hp = Math.max(0, c.stats.hp - city.defense * 0.1);
        if (c.stats.hp <= 0) {
          c.alive = false;
          c.deadTicks = 60;
        }
      }
    }
  }
}