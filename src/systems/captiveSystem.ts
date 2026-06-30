// 責務: 拉致NPCの逃亡判定と露見ペナルティ、監禁状態管理
import { Rng } from '../util/rng';
import { dist } from '../util/math';
import { AI, HEALTH, RENDER } from '../config/constants';
import { clamp } from '../util/math';
import type { Character } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_DEATH = 0xff5555;

export function updateCaptive(rng: Rng, state: GameState, c: Character): void {
  if (c.captive.capturedBy === null) return;
  const captor = state.characters.get(c.captive.capturedBy);
  if (!captor || !captor.alive) {
    c.captive.capturedBy = null;
    c.captive.followingLeader = null;
    c.captive.imprisoned = false;
    return;
  }

  if (captor.fortId !== null) {
    const fort = state.fortById(captor.fortId);
    if (fort && dist(c.x, c.y, fort.x, fort.y) <= RENDER.CITY_RADIUS) {
      c.captive.imprisoned = true;
    }
  }

  if (c.personality.courage < 0.3) return;

  const chance = c.captive.imprisoned ? AI.ESCAPE_CHANCE_CAPTIVE : AI.ESCAPE_CHANCE_CAPTIVE * 2;
  if (rng.chance(chance)) {
    if (rng.chance(0.5)) {
      c.captive.capturedBy = null;
      c.captive.followingLeader = null;
      c.captive.imprisoned = false;
      state.addEvent(`${displayName(c)} が逃亡に成功`, COLOR_DEATH, [c.id]);
      c.history.push({ stamp: '', text: '逃亡に成功した' });
    } else {
      c.stats.health = clamp(c.stats.health - HEALTH.MAX * 0.3, 0, HEALTH.MAX);
      state.addEvent(`${displayName(c)} の逃亡が露見し健康を害した`, COLOR_DEATH, [c.id]);
    }
  }
}