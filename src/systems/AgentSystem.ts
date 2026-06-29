// src/systems/AgentSystem.ts
// 責務: 全エージェントの認識→ゴール選択→計画→行動実行ループ。移動・戦闘・回復・社交・略奪を駆動する。

import { WorldState } from '../world/WorldState';
import { Rng } from '../util/rng';
import type { CharacterData, PlanStep } from '../domain/types';
import { ActionType, AgentGoal, LifeState } from '../domain/enums';
import { perceive } from '../ai/WorldFacts';
import { selectGoal } from '../ai/GoalSelector';
import { buildPlan } from '../ai/GoapPlanner';
import { CombatSystem } from './CombatSystem';
import { RecoverySystem } from './RecoverySystem';
import { RelationGraph } from '../social/RelationGraph';
import { EventLog } from '../log/EventLog';
import { relationChat } from '../social/ChatGenerator';
import { characterDisplayName } from '../entities/Character';
import { GOAP, PERCEPTION, RELATION, CHAT } from '../config/aiConfig';
import { MOVEMENT, WORLD } from '../config/constants';
import { distance, normalize, clamp, distanceSq } from '../util/math';

const ATTACK_RANGE_SQ = PERCEPTION.ATTACK_RANGE * PERCEPTION.ATTACK_RANGE;
const SOCIAL_RANGE_SQ = 120 * 120;

function speedOf(c: CharacterData): number {
  const base = c.kind === 'NPC' ? MOVEMENT.NPC_BASE_SPEED : MOVEMENT.MONSTER_BASE_SPEED;
  const agilityFactor = 0.7 + (c.attr.agility / 30) * 0.6;
  const healthFactor = c.attr.health < 60 ? 0.7 : 1;
  return base * agilityFactor * healthFactor;
}

export class AgentSystem {
  constructor(
    private readonly combat: CombatSystem,
    private readonly recovery: RecoverySystem,
    private readonly relations: RelationGraph,
    private readonly log: EventLog,
    private readonly rng: Rng,
  ) {}

  update(world: WorldState, dt: number): void {
    this.combat.cooldownAll(world, dt);
    for (const c of world.characters.values()) {
      if (c.state === LifeState.Dead) continue;
      c.animPhase += dt * 4;
      c.planTimer -= dt;
      if (c.planTimer <= 0 || c.plan.length === 0) {
        this.replan(world, c);
        c.planTimer = GOAP.REPLAN_INTERVAL_SEC;
      }
      this.executePlan(world, c, dt);
    }
  }

  private replan(world: WorldState, c: CharacterData): void {
    const facts = perceive(world, c);
    const goal = selectGoal(c, facts);
    c.goal = goal;
    c.plan = buildPlan(c, goal, facts, this.rng);
    if (facts.nearestEnemy) c.combatTargetId = facts.nearestEnemy.id;
  }

  private executePlan(world: WorldState, c: CharacterData, dt: number): void {
    if (c.plan.length === 0) {
      c.idleTimer += dt;
      if (c.idleTimer >= MOVEMENT.IDLE_MAX_SECONDS) {
        this.replan(world, c);
        c.idleTimer = 0;
      }
      return;
    }
    const step = c.plan[0];
    const done = this.runStep(world, c, step, dt);
    if (done) {
      c.plan.shift();
    }
  }

  private runStep(world: WorldState, c: CharacterData, step: PlanStep, dt: number): boolean {
    switch (step.action) {
      case ActionType.MoveTo:
        return this.stepMove(world, c, step, dt);
      case ActionType.FleeFrom:
        return this.stepMove(world, c, step, dt);
      case ActionType.EnterCity:
        return this.stepMove(world, c, step, dt);
      case ActionType.AttackTarget:
        return this.stepAttack(world, c, step);
      case ActionType.RobTarget:
        return this.stepRob(world, c, step);
      case ActionType.RecoverInCity:
        return this.stepRecover(world, c, dt);
      case ActionType.Socialize:
        return this.stepSocialize(world, c, step);
      default:
        return true;
    }
  }

  private stepMove(world: WorldState, c: CharacterData, step: PlanStep, dt: number): boolean {
    if (!step.targetPos) return true;
    const target = step.targetPos;
    const dist = distance(c.position, target);
    if (dist <= MOVEMENT.ARRIVE_RADIUS) {
      c.velocity.x = 0;
      c.velocity.y = 0;
      return true;
    }
    const dir = normalize({ x: target.x - c.position.x, y: target.y - c.position.y });
    const sp = speedOf(c);
    c.position.x = clamp(c.position.x + dir.x * sp * dt, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
    c.position.y = clamp(c.position.y + dir.y * sp * dt, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
    world.grid.update(c.id, c.position);
    c.idleTimer = 0;
    return false;
  }

  private stepAttack(world: WorldState, c: CharacterData, step: PlanStep): boolean {
    if (step.targetId === null) return true;
    const target = world.characters.get(step.targetId);
    if (!target || target.state === LifeState.Dead) return true;
    const dSq = distanceSq(c.position, target.position);
    if (dSq > ATTACK_RANGE_SQ) {
      const dir = normalize({ x: target.x - c.position.x, y: target.y - c.position.y });
      const sp = speedOf(c);
      c.position.x = clamp(c.position.x + dir.x * sp * 0.05, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
      c.position.y = clamp(c.position.y + dir.y * sp * 0.05, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
      world.grid.update(c.id, c.position);
      return false;
    }
    this.combat.resolveAttack(world, c, target);
    return target.state === LifeState.Dead;
  }

  private stepRob(world: WorldState, c: CharacterData, step: PlanStep): boolean {
    if (step.targetId === null) return true;
    const target = world.characters.get(step.targetId);
    if (!target || target.state === LifeState.Dead) return true;
    const dSq = distanceSq(c.position, target.position);
    if (dSq > ATTACK_RANGE_SQ) return false;
    this.combat.banditRob(world, c, target);
    return true;
  }

  private stepRecover(world: WorldState, c: CharacterData, dt: number): boolean {
    if (!c.homeCityId && c.plan.length === 0) return true;
    const facts = perceive(world, c);
    if (!facts.nearestCity) return true;
    const dSq = distanceSq(c.position, facts.nearestCity.position);
    if (dSq > PERCEPTION.CITY_INTERACT_RADIUS * PERCEPTION.CITY_INTERACT_RADIUS) {
      const dir = normalize({
        x: facts.nearestCity.position.x - c.position.x,
        y: facts.nearestCity.position.y - c.position.y,
      });
      const sp = speedOf(c);
      c.position.x = clamp(c.position.x + dir.x * sp * dt, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
      c.position.y = clamp(c.position.y + dir.y * sp * dt, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
      world.grid.update(c.id, c.position);
      return false;
    }
    const recovered = this.recovery.recoverInCity(world, c, facts.nearestCity, dt);
    return recovered;
  }

  private stepSocialize(world: WorldState, c: CharacterData, step: PlanStep): boolean {
    if (step.targetId === null) return true;
    const other = world.characters.get(step.targetId);
    if (!other || other.state === LifeState.Dead) return true;
    const dSq = distanceSq(c.position, other.position);
    if (dSq > SOCIAL_RANGE_SQ) {
      const dir = normalize({ x: other.position.x - c.position.x, y: other.position.y - c.position.y });
      const sp = speedOf(c);
      c.position.x = clamp(c.position.x + dir.x * sp * 0.08, WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN);
      c.position.y = clamp(c.position.y + dir.y * sp * 0.08, WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN);
      world.grid.update(c.id, c.position);
      return false;
    }
    const kind = this.relations.kindOf(c.id, other.id);
    this.relations.adjust(c.id, other.id, RELATION.CHAT_FRIEND_GAIN);
    if (this.rng.chance(CHAT.ENCOUNTER_CHAT_CHANCE * 50)) {
      this.log.pushChat(world.date, c.id, characterDisplayName(c), relationChat(this.rng, kind));
    }
    return true;
  }
}