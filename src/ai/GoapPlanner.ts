// src/ai/GoapPlanner.ts
// 責務: 選択されたゴールを達成する PlanStep 列を生成する（前提→行動の単純前向き連鎖）。

import type { CharacterData, PlanStep, Vec2 } from '../domain/types';
import type { PerceivedFacts } from './WorldFacts';
import { AgentGoal } from '../domain/enums';
import { PERCEPTION, GOAP } from '../config/aiConfig';
import {
  moveStep,
  attackStep,
  fleeStep,
  enterCityStep,
  recoverStep,
  robStep,
  socializeStep,
} from './Actions';
import { Rng } from '../util/rng';
import { WORLD } from '../config/constants';
import { clamp, normalize } from '../util/math';

function fleeDestination(self: CharacterData, threat: Vec2): Vec2 {
  const dir = normalize({ x: self.position.x - threat.x, y: self.position.y - threat.y });
  return {
    x: clamp(self.position.x + dir.x * 500, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
    y: clamp(self.position.y + dir.y * 500, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN),
  };
}

function wanderDestination(self: CharacterData, rng: Rng): Vec2 {
  const range = 1000;
  return {
    x: clamp(self.position.x + rng.range(-range, range), WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
    y: clamp(self.position.y + rng.range(-range, range), WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN),
  };
}

export function buildPlan(
  self: CharacterData,
  goal: AgentGoal,
  facts: PerceivedFacts,
  rng: Rng,
): PlanStep[] {
  const plan: PlanStep[] = [];
  switch (goal) {
    case AgentGoal.Hunt: {
      if (facts.nearestEnemy) {
        plan.push(moveStep(facts.nearestEnemy.position));
        plan.push(attackStep(facts.nearestEnemy.id));
      }
      break;
    }
    case AgentGoal.Rob: {
      if (facts.nearestEnemy) {
        plan.push(moveStep(facts.nearestEnemy.position));
        plan.push(robStep(facts.nearestEnemy.id));
      }
      break;
    }
    case AgentGoal.Flee: {
      const threat = facts.nearestEnemy ? facts.nearestEnemy.position : self.position;
      plan.push(fleeStep(fleeDestination(self, threat)));
      break;
    }
    case AgentGoal.RecoverInCity: {
      if (facts.nearestCity) {
        plan.push(enterCityStep(facts.nearestCity.position));
        plan.push(recoverStep());
      }
      break;
    }
    case AgentGoal.Socialize: {
      if (facts.nearestAlly) {
        plan.push(moveStep(facts.nearestAlly.position));
        plan.push(socializeStep(facts.nearestAlly.id));
      }
      break;
    }
    case AgentGoal.Wander:
    default: {
      plan.push(moveStep(wanderDestination(self, rng)));
      break;
    }
  }
  if (plan.length > GOAP.MAX_PLAN_DEPTH) {
    plan.length = GOAP.MAX_PLAN_DEPTH;
  }
  return plan;
}

export const PLANNER_RANGES = {
  CITY_INTERACT_SQ: PERCEPTION.CITY_INTERACT_RADIUS * PERCEPTION.CITY_INTERACT_RADIUS,
} as const;