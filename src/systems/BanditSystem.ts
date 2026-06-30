// 責務: 悪徳NPC（夜盗）化・砦構築・リクルート・砦の朽ち消滅
import { Rng } from '../util/rng';
import { dist } from '../util/math';
import { MORAL, AI } from '../config/constants';
import { allocId } from '../factory/characterFactory';
import { computeTitle } from '../factory/characterFactory';
import type { Character, Fort } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_DEATH = 0xff5555;

export function maybeTurnBandit(rng: Rng, state: GameState, c: Character): void {
  if (c.kind !== 'npc') return;
  const broke = c.inventory.money <= 0;
  const evilNature = c.stats.moral <= MORAL.EVIL_THRESHOLD;
  if (!(broke && c.personality.greed > 0.6) && !(evilNature && rng.chance(0.002))) return;

  c.kind = 'bandit';
  c.stats.moral = Math.min(c.stats.moral, MORAL.EVIL_THRESHOLD);
  c.title = computeTitle('bandit', c.stats, c.personality);
  c.homeId = null;

  let fort = nearestFort(state, c);
  if (!fort || dist(c.x, c.y, fort.x, fort.y) > AI.WANDER_RADIUS) {
    fort = { id: allocId(), x: c.x, y: c.y, members: [], alive: true };
    state.forts.push(fort);
  }
  fort.members.push(c.id);
  c.fortId = fort.id;
  state.addEvent(`${displayName(c)} が夜盗と化した`, COLOR_DEATH, [c.id]);
  c.history.push({ stamp: '', text: '夜盗と化した' });
}

function nearestFort(state: GameState, c: Character): Fort | null {
  let best: Fort | null = null;
  let bestD = Infinity;
  for (const f of state.forts) {
    if (!f.alive) continue;
    const d = dist(c.x, c.y, f.x, f.y);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

export function recruitWeakBandits(rng: Rng, state: GameState, leader: Character, nearby: Character[]): void {
  if (leader.kind !== 'bandit' || leader.fortId === null) return;
  const fort = state.fortById(leader.fortId);
  if (!fort) return;
  for (const other of nearby) {
    if (other.kind !== 'bandit') continue;
    if (other.fortId === leader.fortId) continue;
    if (other.stats.power >= leader.stats.power) continue;
    if (!rng.chance(0.1)) continue;
    if (other.fortId !== null) {
      const prev = state.fortById(other.fortId);
      if (prev) prev.members = prev.members.filter((m) => m !== other.id);
    }
    other.fortId = fort.id;
    fort.members.push(other.id);
    other.captive.followingLeader = leader.id;
  }
}

export function decayForts(state: GameState): void {
  for (const fort of state.forts) {
    if (!fort.alive) continue;
    fort.members = fort.members.filter((id) => {
      const c = state.characters.get(id);
      return c !== undefined && c.alive && c.kind === 'bandit';
    });
    if (fort.members.length === 0) {
      fort.alive = false;
      state.addEvent('砦が朽ちて消滅した', COLOR_DEATH, []);
    }
  }
  state.forts = state.forts.filter((f) => f.alive);
}