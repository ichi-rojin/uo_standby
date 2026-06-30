// 責務: 各エージェントの目標実行（移動・戦闘・交流・休養の統合制御）
import { Rng } from '../util/rng';
import { dist, dist2 } from '../util/math';
import { AI, RENDER, NEED } from '../config/constants';
import { SpatialGrid } from '../world/spatialGrid';
import { planGoal } from './goalPlanner';
import { moveTowards, applyMovement, speedFromStats } from '../systems/movementSystem';
import { performAttack, inAttackRange, monsterShout } from '../systems/combatSystem';
import { interact, isHostileRelation } from '../systems/relationSystem';
import { tryMate } from '../systems/reproductionSystem';
import { tryRestAtSafe, spendExperience } from '../systems/citySystem';
import { tryAcceptQuest } from '../systems/questSystem';
import { recruitWeakBandits } from '../systems/banditSystem';
import type { Character, City, EntityId } from '../domain/types';
import type { GameState } from '../state/gameState';

const neighborBuf: EntityId[] = [];

function nearestCity(state: GameState, c: Character): City | null {
  let best: City | null = null;
  let bestD = Infinity;
  for (const city of state.cities) {
    const d = dist2(c.x, c.y, city.x, city.y);
    if (d < bestD) {
      bestD = d;
      best = city;
    }
  }
  return best;
}

function perceptionRange(c: Character): number {
  return AI.PERCEPTION_BASE + c.stats.perception * 2;
}

function findHostileTarget(state: GameState, grid: SpatialGrid, c: Character): Character | null {
  grid.queryRadius(c.x, c.y, perceptionRange(c), neighborBuf);
  let best: Character | null = null;
  let bestD = Infinity;
  for (const id of neighborBuf) {
    if (id === c.id) continue;
    const other = state.characters.get(id);
    if (!other || !other.alive) continue;
    if (!isEnemy(c, other)) continue;
    const d = dist2(c.x, c.y, other.x, other.y);
    if (d < bestD) {
      bestD = d;
      best = other;
    }
  }
  return best;
}

function isEnemy(a: Character, b: Character): boolean {
  if (a.kind === 'monster' || a.kind === 'boss') {
    return b.kind === 'npc' || b.kind === 'bandit';
  }
  if (a.kind === 'npc') {
    if (b.kind === 'monster' || b.kind === 'boss' || b.kind === 'bandit') return true;
    return isHostileRelation(a, b.id);
  }
  if (a.kind === 'bandit') {
    return b.kind !== 'bandit' || isHostileRelation(a, b.id);
  }
  return false;
}

function findAlly(state: GameState, grid: SpatialGrid, c: Character): Character | null {
  grid.queryRadius(c.x, c.y, RENDER.ICON_RADIUS * 4, neighborBuf);
  for (const id of neighborBuf) {
    if (id === c.id) continue;
    const other = state.characters.get(id);
    if (!other || !other.alive || other.kind !== 'npc') continue;
    return other;
  }
  return null;
}

export function updateAgent(rng: Rng, state: GameState, grid: SpatialGrid, c: Character): void {
  if (!c.alive) return;
  if (c.attackCooldown > 0) c.attackCooldown -= 1;
  if (c.reproCooldown > 0) c.reproCooldown -= 1;
  c.idleTicks += 1;

  c.goal = planGoal(c);
  const speed = speedFromStats(c);

  switch (c.goal) {
    case 'follow':
      executeFollow(c, state, speed);
      break;
    case 'flee':
      executeFlee(rng, state, grid, c, speed);
      break;
    case 'hunt':
    case 'rob':
      executeHunt(rng, state, grid, c, speed);
      break;
    case 'raid':
      executeHunt(rng, state, grid, c, speed);
      break;
    case 'eat':
    case 'sleep':
    case 'restCity':
    case 'gainMoney':
      executeReturnSafe(rng, state, c, speed);
      break;
    case 'mate':
      executeMate(rng, state, grid, c, speed);
      break;
    case 'wander':
      executeWander(rng, state, grid, c, speed);
      break;
    case 'idle':
      executeIdle(c);
      break;
  }

  if (c.idleTicks > AI.NO_ACTION_LIMIT_TICKS) {
    const tx = c.x + rng.range(-100, 100);
    const ty = c.y + rng.range(-100, 100);
    moveTowards(c, tx, ty, speed);
    c.idleTicks = 0;
  }

  applyMovement(c);
}

function executeFollow(c: Character, state: GameState, speed: number): void {
  const leaderId = c.captive.followingLeader as EntityId;
  const leader = state.characters.get(leaderId);
  if (!leader || !leader.alive) {
    c.captive.followingLeader = null;
    c.captive.capturedBy = null;
    c.captive.imprisoned = false;
    return;
  }
  moveTowards(c, leader.x, leader.y, speed);
  c.idleTicks = 0;
}

function executeFlee(rng: Rng, state: GameState, grid: SpatialGrid, c: Character, speed: number): void {
  const threat = findHostileTarget(state, grid, c);
  if (threat) {
    const dx = c.x - threat.x;
    const dy = c.y - threat.y;
    moveTowards(c, c.x + dx, c.y + dy, speed * 1.3);
  } else {
    const city = nearestCity(state, c);
    if (city) moveTowards(c, city.x, city.y, speed);
    c.fleeing = false;
  }
  c.idleTicks = 0;
}

function executeHunt(rng: Rng, state: GameState, grid: SpatialGrid, c: Character, speed: number): void {
  const target = findHostileTarget(state, grid, c);
  if (!target) {
    executeWander(rng, state, grid, c, speed);
    return;
  }
  c.targetId = target.id;
  if (inAttackRange(c, target)) {
    if (c.kind === 'monster' && rng.chance(0.1)) monsterShout(state, c);
    performAttack(rng, state, c, target);
  } else {
    moveTowards(c, target.x, target.y, speed);
  }
  c.idleTicks = 0;
}

function executeReturnSafe(rng: Rng, state: GameState, c: Character, speed: number): void {
  const city = nearestCity(state, c);
  if (!city) return;
  if (dist(c.x, c.y, city.x, city.y) <= RENDER.CITY_RADIUS + 20) {
    tryRestAtSafe(state, c);
    spendExperience(c);
    tryAcceptQuest(rng, city, c);
    c.needs.libido = Math.min(NEED.MAX, c.needs.libido);
    c.idleTicks = 0;
  } else {
    moveTowards(c, city.x, city.y, speed);
    c.idleTicks = 0;
  }
}

function executeMate(rng: Rng, state: GameState, grid: SpatialGrid, c: Character, speed: number): void {
  const city = nearestCity(state, c);
  if (!city) return;
  if (dist(c.x, c.y, city.x, city.y) <= RENDER.CITY_RADIUS + 20) {
    const ally = findAlly(state, grid, c);
    if (ally && ally.sex !== c.sex) {
      interact(rng, state, c, ally);
      tryMate(rng, state, c, ally, city);
    }
    c.idleTicks = 0;
  } else {
    moveTowards(c, city.x, city.y, speed);
    c.idleTicks = 0;
  }
}

function executeWander(rng: Rng, state: GameState, grid: SpatialGrid, c: Character, speed: number): void {
  if (c.kind === 'bandit') {
    grid.queryRadius(c.x, c.y, AI.BANDIT_RECRUIT_RANGE, neighborBuf);
    const arr: Character[] = [];
    for (const id of neighborBuf) {
      const o = state.characters.get(id);
      if (o) arr.push(o);
    }
    recruitWeakBandits(rng, state, c, arr);
  }
  const ally = findAlly(state, grid, c);
  if (ally && c.kind === 'npc') {
    interact(rng, state, c, ally);
  }
  if (rng.chance(0.05) || (c.vx === 0 && c.vy === 0)) {
    const tx = c.x + rng.range(-AI.WANDER_RADIUS, AI.WANDER_RADIUS);
    const ty = c.y + rng.range(-AI.WANDER_RADIUS, AI.WANDER_RADIUS);
    moveTowards(c, tx, ty, speed);
  }
  c.idleTicks = 0;
}

function executeIdle(c: Character): void {
  c.vx = 0;
  c.vy = 0;
}