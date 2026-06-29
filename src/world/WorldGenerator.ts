// src/world/WorldGenerator.ts
// 責務: ワールドの初期自動生成（都市・補給拠点・道路・NPC・初期モンスター）を行う。

import { WorldState } from './WorldState';
import { createCity } from '../entities/City';
import { createSupplyPost } from '../entities/SupplyPost';
import { createCharacter } from '../entities/Character';
import { buildRoadNetwork } from './RoadNetwork';
import { CharacterKind } from '../domain/enums';
import { COUNTS, WORLD } from '../config/constants';
import { Rng } from '../util/rng';
import type { Vec2 } from '../domain/types';
import { distanceSq } from '../util/math';
import { pickSpawnPosition } from '../systems/SpawnSystem';
import { monsterTintFromStrength, npcTint } from '../render/ColorUtil';

const MIN_CITY_SEPARATION = 700;
const MIN_POST_SEPARATION = 250;

function scatterPoints(
  rng: Rng,
  count: number,
  minSep: number,
  existing: Vec2[],
): Vec2[] {
  const result: Vec2[] = [];
  const minX = WORLD.EDGE_MARGIN;
  const maxX = WORLD.WIDTH - WORLD.EDGE_MARGIN;
  const minY = WORLD.EDGE_MARGIN;
  const maxY = WORLD.HEIGHT - WORLD.EDGE_MARGIN;
  const minSepSq = minSep * minSep;
  let attempts = 0;
  const maxAttempts = count * 200;
  while (result.length < count && attempts < maxAttempts) {
    attempts += 1;
    const p: Vec2 = { x: rng.range(minX, maxX), y: rng.range(minY, maxY) };
    let ok = true;
    for (const e of existing) {
      if (distanceSq(p, e) < minSepSq) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    for (const r of result) {
      if (distanceSq(p, r) < minSepSq) {
        ok = false;
        break;
      }
    }
    if (ok) result.push(p);
  }
  return result;
}

export function generateWorld(seed: number): WorldState {
  const rng = new Rng(seed);
  const world = new WorldState();

  const cityPoints = scatterPoints(rng, COUNTS.CITIES, MIN_CITY_SEPARATION, []);
  cityPoints.forEach((p, i) => {
    world.cities.push(createCity(p, i, rng));
  });

  const allCityPositions = world.cities.map((c) => c.position);
  const postPoints = scatterPoints(
    rng,
    COUNTS.SUPPLY_POSTS,
    MIN_POST_SEPARATION,
    allCityPositions,
  );
  postPoints.forEach((p, i) => {
    world.supplyPosts.push(createSupplyPost(p, i));
  });

  world.roads = buildRoadNetwork(world.cities, world.supplyPosts);

  for (let i = 0; i < COUNTS.NPCS; i += 1) {
    const homeCity = rng.pick(world.cities);
    const pos = pickSpawnPosition(world, rng);
    const npc = createCharacter({
      kind: CharacterKind.NPC,
      position: pos,
      rng,
      tint: npcTint(rng),
      homeCityId: homeCity.id,
    });
    world.addCharacter(npc);
    homeCity.residentIds.add(npc.id);
  }

  const initialMonsters = COUNTS.MONSTER_MIN;
  for (let i = 0; i < initialMonsters; i += 1) {
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

  return world;
}