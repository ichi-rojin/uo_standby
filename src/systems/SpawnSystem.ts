// 責務: NPC・モンスターの個体数維持リスポーンと死体消滅処理
import { Rng } from '../util/rng';
import { dist } from '../util/math';
import { COUNTS, WORLD, AI } from '../config/constants';
import { createCharacter } from '../factory/characterFactory';
import { biomeAt } from '../world/biome';
import type { Character } from '../domain/types';
import type { GameState } from '../state/gameState';

const MIN_DIST_FROM_ROAD = 700;

function farFromCivilization(state: GameState, x: number, y: number): boolean {
  for (const c of state.cities) {
    if (dist(x, y, c.x, c.y) < MIN_DIST_FROM_ROAD) return false;
  }
  for (const r of state.roads) {
    const mx = (r.ax + r.bx) / 2;
    const my = (r.ay + r.by) / 2;
    if (dist(x, y, mx, my) < MIN_DIST_FROM_ROAD * 0.6) return false;
  }
  return true;
}

export function maintainPopulations(rng: Rng, state: GameState): void {
  respawnNpcs(rng, state);
  respawnMonsters(rng, state);
}

function respawnNpcs(rng: Rng, state: GameState): void {
  const count = state.livingNpcCount();
  if (count >= COUNTS.NPC_MIN) return;
  const need = Math.min(COUNTS.NPC_MAX - count, 3);
  for (let i = 0; i < need; i++) {
    const banditFortAvailable = state.forts.find((f) => f.alive);
    let x: number;
    let y: number;
    let homeId: number | null = null;
    if (banditFortAvailable && rng.chance(0.15)) {
      x = banditFortAvailable.x;
      y = banditFortAvailable.y;
    } else {
      const city = rng.pick(state.cities);
      x = city.x;
      y = city.y;
      homeId = city.id;
    }
    const npc = createCharacter(rng, 'npc', x, y, null, homeId);
    state.characters.set(npc.id, npc);
    if (homeId !== null) {
      const c = state.cityById(homeId);
      if (c) c.residents.push(npc.id);
    }
  }
}

function respawnMonsters(rng: Rng, state: GameState): void {
  const count = state.livingMonsterCount();
  if (count >= COUNTS.MONSTER_MIN) return;
  const need = Math.min(COUNTS.MONSTER_MAX - count, 5);
  for (let i = 0; i < need; i++) {
    let x = 0;
    let y = 0;
    let ok = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      if (rng.chance(0.6) && state.bosses.length > 0) {
        const boss = rng.pick(state.bosses);
        x = boss.x + rng.range(-AI.WANDER_RADIUS, AI.WANDER_RADIUS);
        y = boss.y + rng.range(-AI.WANDER_RADIUS, AI.WANDER_RADIUS);
      } else {
        x = rng.range(WORLD.MARGIN, WORLD.WIDTH - WORLD.MARGIN);
        y = rng.range(WORLD.MARGIN, WORLD.HEIGHT - WORLD.MARGIN);
      }
      x = Math.max(WORLD.MARGIN, Math.min(WORLD.WIDTH - WORLD.MARGIN, x));
      y = Math.max(WORLD.MARGIN, Math.min(WORLD.HEIGHT - WORLD.MARGIN, y));
      if (farFromCivilization(state, x, y)) {
        ok = true;
        break;
      }
    }
    if (!ok) continue;
    const m = createCharacter(rng, 'monster', x, y, null, null);
    m.biomeIndex = biomeAt(x, y);
    state.characters.set(m.id, m);
  }
}

export function cleanupDead(state: GameState): void {
  const toDelete: number[] = [];
  for (const c of state.characters.values()) {
    if (c.alive) continue;
    if (c.kind === 'boss') continue;
    c.deadTicks -= 1;
    if (c.deadTicks <= 0) toDelete.push(c.id);
  }
  for (const id of toDelete) {
    const c = state.characters.get(id);
    if (c && c.homeId !== null) {
      const city = state.cityById(c.homeId);
      if (city) city.residents = city.residents.filter((r) => r !== id);
    }
    state.characters.delete(id);
  }
}