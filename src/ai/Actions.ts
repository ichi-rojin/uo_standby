// src/ai/Actions.ts
// 責務: GOAP の各アクションの前提条件・効果・コストの定義と、PlanStep 生成ヘルパを提供する。

import { ActionType } from '../domain/enums';
import type { CharacterData, PlanStep, Vec2 } from '../domain/types';
import type { EntityId } from '../domain/ids';

export function moveStep(pos: Vec2): PlanStep {
  return { action: ActionType.MoveTo, targetId: null, targetPos: { x: pos.x, y: pos.y } };
}

export function attackStep(targetId: EntityId): PlanStep {
  return { action: ActionType.AttackTarget, targetId, targetPos: null };
}

export function fleeStep(pos: Vec2): PlanStep {
  return { action: ActionType.FleeFrom, targetId: null, targetPos: { x: pos.x, y: pos.y } };
}

export function enterCityStep(pos: Vec2): PlanStep {
  return { action: ActionType.EnterCity, targetId: null, targetPos: { x: pos.x, y: pos.y } };
}

export function recoverStep(): PlanStep {
  return { action: ActionType.RecoverInCity, targetId: null, targetPos: null };
}

export function robStep(targetId: EntityId): PlanStep {
  return { action: ActionType.RobTarget, targetId, targetPos: null };
}

export function socializeStep(targetId: EntityId): PlanStep {
  return { action: ActionType.Socialize, targetId, targetPos: null };
}

export function lowHealth(c: CharacterData): boolean {
  return c.attr.hp < c.attr.maxHp * 0.35 || c.attr.health < 50;
}