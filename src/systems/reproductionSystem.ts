// 責務: 異性NPCの交配判定・子供記録・成熟によるNPC化
import { Rng } from '../util/rng';
import { REPRO, TIME, RELATION } from '../config/constants';
import { createCharacter } from '../factory/characterFactory';
import type { Character, City } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_RELATION = 0x55ff55;

export function tryMate(rng: Rng, state: GameState, a: Character, b: Character, city: City): void {
  if (a.sex === b.sex) return;
  if (a.kind !== 'npc' || b.kind !== 'npc') return;
  if (a.reproCooldown > 0 || b.reproCooldown > 0) return;
  if (a.needs.libido < REPRO.LIBIDO_REQ || b.needs.libido < REPRO.LIBIDO_REQ) return;
  const rel = a.relations.get(b.id) ?? 0;
  if (rel < RELATION.FRIEND) return;

  a.reproCooldown = REPRO.COOLDOWN_TICKS;
  b.reproCooldown = REPRO.COOLDOWN_TICKS;
  a.needs.libido = 0;
  b.needs.libido = 0;

  const female = a.sex === 'female' ? a : b;
  const yearsTicks = REPRO.CHILD_MATURE_TICKS_YEARS * 12 * 30 * 24;
  city.children.push({
    sex: rng.chance(0.5) ? 'male' : 'female',
    lastName: female.lastName,
    maturityTick: state.tick + yearsTicks,
  });

  state.addEvent(`${displayName(a)} と ${displayName(b)} が交配`, COLOR_RELATION, [a.id, b.id]);
  a.history.push({ stamp: '', text: `${displayName(b)}と交配` });
  b.history.push({ stamp: '', text: `${displayName(a)}と交配` });
}

export function maturateChildren(rng: Rng, state: GameState): void {
  for (const city of state.cities) {
    for (let i = city.children.length - 1; i >= 0; i--) {
      const child = city.children[i];
      if (state.tick < child.maturityTick) continue;
      city.children.splice(i, 1);
      if (state.livingNpcCount() >= 255) continue;
      const npc = createCharacter(rng, 'npc', city.x, city.y, child.sex, city.id);
      npc.lastName = child.lastName;
      state.characters.set(npc.id, npc);
      city.residents.push(npc.id);
      state.addEvent(`${displayName(npc)} が成人しNPC化`, COLOR_RELATION, [npc.id]);
    }
  }
}

export const TICKS_PER_YEAR = TIME.GAME_SECONDS_PER_TICK;