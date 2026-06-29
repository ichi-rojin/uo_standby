// src/ai/WorldFacts.ts
// 責務: 1体のエージェントの状況認識（近傍の敵・味方・都市）を空間グリッドで構築する。O(N^2)禁止。

import { WorldState } from '../world/WorldState';
import type { CharacterData, CityData, Vec2 } from '../domain/types';
import type { EntityId } from '../domain/ids';
import { CharacterKind, LifeState, Allegiance } from '../domain/enums';
import { PERCEPTION } from '../config/aiConfig';
import { distanceSq } from '../util/math';

export interface PerceivedFacts {
  nearestEnemy: CharacterData | null;
  nearestEnemyDistSq: number;
  nearestAlly: CharacterData | null;
  nearestCity: CityData | null;
  nearestCityDistSq: number;
}

function isEnemy(self: CharacterData, other: CharacterData): boolean {
  if (other.state === LifeState.Dead) return false;
  if (self.kind === CharacterKind.NPC) {
    if (other.kind !== CharacterKind.NPC) return true;
    if (other.allegiance === Allegiance.Bandit && self.allegiance === Allegiance.Citizen) return true;
    if (other.allegiance === Allegiance.Citizen && self.allegiance === Allegiance.Bandit) return true;
    return false;
  }
  return other.kind === CharacterKind.NPC;
}

function isAlly(self: CharacterData, other: CharacterData): boolean {
  if (other.state === LifeState.Dead) return false;
  if (other.id === self.id) return false;
  if (self.kind !== CharacterKind.NPC) return false;
  if (other.kind !== CharacterKind.NPC) return false;
  return other.allegiance === self.allegiance;
}

function findNearestCity(world: WorldState, pos: Vec2): { city: CityData | null; distSq: number } {
  let best: CityData | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const city of world.cities) {
    const d = distanceSq(pos, city.position);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return { city: best, distSq: bestDist };
}

export function perceive(world: WorldState, self: CharacterData): PerceivedFacts {
  const near: EntityId[] = world.grid.queryRadius(self.position, PERCEPTION.SIGHT_RADIUS);
  let nearestEnemy: CharacterData | null = null;
  let nearestEnemyDistSq = Number.POSITIVE_INFINITY;
  let nearestAlly: CharacterData | null = null;
  let nearestAllyDistSq = Number.POSITIVE_INFINITY;

  for (const id of near) {
    const other = world.characters.get(id);
    if (!other) continue;
    const d = distanceSq(self.position, other.position);
    if (isEnemy(self, other) && d < nearestEnemyDistSq) {
      nearestEnemyDistSq = d;
      nearestEnemy = other;
    }
    if (isAlly(self, other) && d < nearestAllyDistSq) {
      nearestAllyDistSq = d;
      nearestAlly = other;
    }
  }

  const cityResult = findNearestCity(world, self.position);
  return {
    nearestEnemy,
    nearestEnemyDistSq,
    nearestAlly,
    nearestCity: cityResult.city,
    nearestCityDistSq: cityResult.distSq,
  };
}