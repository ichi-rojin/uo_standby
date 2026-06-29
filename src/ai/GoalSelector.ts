// src/ai/GoalSelector.ts
// 責務: 性格・欲求・状況事実から最適ゴールを選択する（GOAPのゴール決定層）。

import type { CharacterData } from '../domain/types';
import type { PerceivedFacts } from './WorldFacts';
import { AgentGoal, CharacterKind, Personality, Allegiance } from '../domain/enums';
import { PERCEPTION } from '../config/aiConfig';
import { lowHealth } from './Actions';

const SIGHT_SQ = PERCEPTION.SIGHT_RADIUS * PERCEPTION.SIGHT_RADIUS;

function npcGoal(self: CharacterData, facts: PerceivedFacts): AgentGoal {
  if (lowHealth(self) && self.personality !== Personality.Brave) {
    if (facts.nearestEnemy && facts.nearestEnemyDistSq < SIGHT_SQ) return AgentGoal.Flee;
    return AgentGoal.RecoverInCity;
  }
  if (self.allegiance === Allegiance.Bandit) {
    if (facts.nearestEnemy && facts.nearestEnemyDistSq < SIGHT_SQ) {
      return AgentGoal.Rob;
    }
  }
  if (facts.nearestEnemy && facts.nearestEnemyDistSq < SIGHT_SQ) {
    const cowardly = self.personality === Personality.Coward;
    if (cowardly && self.attr.hp < self.attr.maxHp * 0.6) return AgentGoal.Flee;
    return AgentGoal.Hunt;
  }
  if (self.inventory.food <= 1 || self.attr.hp < self.attr.maxHp * 0.7) {
    return AgentGoal.RecoverInCity;
  }
  if (
    (self.attachment > 0.5 || self.personality === Personality.Homebound) &&
    facts.nearestAlly
  ) {
    return AgentGoal.Socialize;
  }
  if (self.attachment > 0.4) return AgentGoal.RecoverInCity;
  return AgentGoal.Wander;
}

function monsterGoal(self: CharacterData, facts: PerceivedFacts): AgentGoal {
  if (facts.nearestEnemy && facts.nearestEnemyDistSq < SIGHT_SQ) {
    if (self.personality === Personality.Coward && self.attr.hp < self.attr.maxHp * 0.4) {
      return AgentGoal.Flee;
    }
    return AgentGoal.Hunt;
  }
  return AgentGoal.Wander;
}

export function selectGoal(self: CharacterData, facts: PerceivedFacts): AgentGoal {
  if (self.kind === CharacterKind.NPC) return npcGoal(self, facts);
  return monsterGoal(self, facts);
}