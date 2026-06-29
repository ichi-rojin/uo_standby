// src/systems/SpawnSystem.ts
// 責務: リスポーン位置の選定（都市と隣接2拠点で作る三角形内・画面端禁止・非スタック）と
//       モンスター数の維持を行う。

import { WorldState } from '../world/WorldState';
import { Rng } from '../util/rng';
import { createCharacter } from '../entities/Character';
import { CharacterKind } from '../domain/enums';
import { COUNTS, SPAWN, WORLD } from '../config/constants';
import type { Vec2, SupplyPostData, CityData } from '../domain/types';
import { distanceSq, randomPointInTriangle, clamp } from '../util/math';
import { monsterTintFromStrength } from '../render/ColorUtil';

const NO_STACK_MIN_DIST = 40;
const NO_STACK_MIN_DIST_SQ = NO_STACK_MIN_DIST * NO_STACK_MIN_DIST;
const MAX_PLACEMENT_TRIES = 12;

function nearestTwoPosts(world: WorldState, city: CityData): SupplyPostData[] {
  const sorted = [...world.supplyPosts].sort(
    (a, b) =>
      distanceSq(city.position, a.position) - distanceSq(city.position, b.position),
  );
  return sorted.slice(0, 2);
}

function isFarFromEdge(p: Vec2): boolean {
  return (
    p.x > WORLD.EDGE_MARGIN &&
    p.x < WORLD.WIDTH - WORLD.EDGE_MARGIN &&
    p.y > WORLD.EDGE_MARGIN &&
    p.y < WORLD.HEIGHT - WORLD.EDGE_MARGIN
  );
}

function notStacked(world: WorldState, p: Vec2): boolean {
  const near = world.grid.queryRadius(p, NO_STACK_MIN_DIST);
  for (const id of near) {
    const other = world.characters.get(id);
    if (!other) continue;
    if (distanceSq(other.position, p) < NO_STACK_MIN_DIST_SQ) return false;
  }
  return true;
}

export function pickSpawnPosition(world: WorldState, rng: Rng): Vec2 {
  if (world.cities.length === 0) {
    return {
      x: clamp(rng.range(0, WORLD.WIDTH), WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
      y: clamp(rng.range(0, WORLD.HEIGHT), WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN),
    };
  }
  for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt += 1) {
    const city = rng.pick(world.cities);
    const posts = nearestTwoPosts(world, city);
    let a = city.position;
    let b: Vec2;
    let c: Vec2;
    if (posts.length >= 2) {
      b = posts[0].position;
      c = posts[1].position;
    } else if (world.cities.length >= 3) {
      const others = world.cities.filter((x) => x.id !== city.id);
      b = others[rng.int(0, others.length - 1)].position;
      c = others[rng.int(0, others.length - 1)].position;
    } else {
      a = city.position;
      b = { x: a.x + 300, y: a.y };
      c = { x: a.x, y: a.y + 300 };
    }
    const p = randomPointInTriangle(a, b, c, rng.next(), rng.next());
    p.x = clamp(p.x, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
    p.y = clamp(p.y, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
    if (isFarFromEdge(p) && notStacked(world, p)) {
      return p;
    }
  }
  const fallbackCity = rng.pick(world.cities);
  return {
    x: clamp(fallbackCity.position.x + rng.range(-200, 200), WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
    y: clamp(fallbackCity.position.y + rng.range(-200, 200), WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN),
  };
}

export class SpawnSystem {
  private timer = 0;

  update(world: WorldState, rng: Rng, dt: number): void {
    this.timer += dt;
    if (this.timer < SPAWN.RESPAWN_INTERVAL_SECONDS) return;
    this.timer = 0;
    const alive = world.countAliveMonsters();
    if (alive >= COUNTS.MONSTER_MAX) return;
    const deficit = COUNTS.MONSTER_MAX - alive;
    const batch = Math.min(SPAWN.MONSTER_RESPAWN_BATCH, deficit);
    for (let i = 0; i < batch; i += 1) {
      const pos = pickSpawnPosition(world, rng);
      const strength = rng.range(0, 1);
      const monster = createCharacter({
        kind: CharacterKind.Monster,
        position: pos,
        rng,
        tint: monsterTintFromStrength(strength),
        homeCityId: null,
      });
      world.addCharacter(monster);
    }
  }
}