// src/systems/MovementSystem.ts
// 責務: 各キャラクターの簡易ゴール（放浪・都市移動・徘徊）に基づく移動更新と無行動禁止を担う。

import { WorldState } from '../world/WorldState';
import { Rng } from '../util/rng';
import { AgentGoal, CharacterKind, LifeState, Personality } from '../domain/enums';
import type { CharacterData, Vec2 } from '../domain/types';
import { MOVEMENT, WORLD } from '../config/constants';
import { distance, normalize, clamp } from '../util/math';

function pickWanderTarget(c: CharacterData, rng: Rng): Vec2 {
  const range = c.kind === CharacterKind.NPC ? 1200 : 600;
  return {
    x: clamp(c.position.x + rng.range(-range, range), WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
    y: clamp(c.position.y + rng.range(-range, range), WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN),
  };
}

function decideGoal(world: WorldState, c: CharacterData, rng: Rng): void {
  if (c.kind === CharacterKind.NPC) {
    const wantsCity = c.attachment > 0.5 || c.personality === Personality.Homebound;
    if (wantsCity && c.homeCityId !== null && rng.chance(0.5)) {
      const city = world.cities.find((x) => x.id === c.homeCityId);
      if (city) {
        c.goal = AgentGoal.TravelToCity;
        c.goalTarget = { x: city.position.x, y: city.position.y };
        return;
      }
    }
    c.goal = AgentGoal.Wander;
    c.goalTarget = pickWanderTarget(c, rng);
    return;
  }
  c.goal = AgentGoal.Wander;
  c.goalTarget = pickWanderTarget(c, rng);
}

function speedOf(c: CharacterData): number {
  const base = c.kind === CharacterKind.NPC ? MOVEMENT.NPC_BASE_SPEED : MOVEMENT.MONSTER_BASE_SPEED;
  const agilityFactor = 0.7 + (c.attr.agility / 30) * 0.6;
  return base * agilityFactor;
}

export class MovementSystem {
  update(world: WorldState, rng: Rng, dt: number): void {
    for (const c of world.characters.values()) {
      if (c.state === LifeState.Dead) continue;
      c.animPhase += dt * 4;

      if (c.goalTarget === null || c.goal === AgentGoal.Idle) {
        c.idleTimer += dt;
        if (c.idleTimer >= MOVEMENT.IDLE_MAX_SECONDS || c.goalTarget === null) {
          decideGoal(world, c, rng);
          c.idleTimer = 0;
        }
      }

      if (c.goalTarget === null) continue;
      const dist = distance(c.position, c.goalTarget);
      if (dist <= MOVEMENT.ARRIVE_RADIUS) {
        c.goal = AgentGoal.Idle;
        c.goalTarget = null;
        c.velocity.x = 0;
        c.velocity.y = 0;
        continue;
      }
      const dir = normalize({
        x: c.goalTarget.x - c.position.x,
        y: c.goalTarget.y - c.position.y,
      });
      const sp = speedOf(c);
      c.velocity.x = dir.x * sp;
      c.velocity.y = dir.y * sp;
      c.position.x += c.velocity.x * dt;
      c.position.y += c.velocity.y * dt;
      c.position.x = clamp(c.position.x, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
      c.position.y = clamp(c.position.y, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
      world.grid.update(c.id, c.position);
      c.idleTimer = 0;
    }
  }
}