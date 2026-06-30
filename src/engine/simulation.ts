// 責務: 1ティックのシミュレーション統合（グリッド再構築・各システム駆動）
import { Rng } from '../util/rng';
import { SpatialGrid } from '../world/spatialGrid';
import { TIME } from '../config/constants';
import { updateAgent } from '../ai/agentBehavior';
import { decayNeeds } from '../systems/needsSystem';
import { tickBuffs } from '../systems/buffSystem';
import { maintainPopulations, cleanupDead } from '../systems/spawnSystem';
import { updateCities, applyCityDefenseDamage } from '../systems/citySystem';
import { maybeTurnBandit, decayForts } from '../systems/banditSystem';
import { maybePostQuest, checkQuestCompletion } from '../systems/questSystem';
import { maturateChildren } from '../systems/reproductionSystem';
import { updateCaptive } from '../systems/captiveSystem';
import { maybeRaid } from '../systems/raidSystem';
import type { GameState } from '../state/gameState';

export class Simulation {
  private readonly grid = new SpatialGrid();

  constructor(private readonly rng: Rng) {}

  step(state: GameState): void {
    state.tick += TIME.GAME_SECONDS_PER_TICK / 3600;

    this.rebuildGrid(state);

    for (const c of state.characters.values()) {
      if (!c.alive) continue;
      decayNeeds(c);
      tickBuffs(c);
      updateCaptive(this.rng, state, c);
      updateAgent(this.rng, state, this.grid, c);
      maybeTurnBandit(this.rng, state, c);
    }

    for (const boss of state.bosses) {
      const bc = state.characters.get(boss.charId);
      if (bc) {
        maybeRaid(this.rng, state, bc);
        boss.x = bc.x;
        boss.y = bc.y;
      }
    }

    updateCities(state);
    applyCityDefenseDamage(state);

    for (const city of state.cities) {
      maybePostQuest(this.rng, state, city);
    }
    checkQuestCompletion(state);
    maturateChildren(this.rng, state);

    decayForts(state);
    cleanupDead(state);
    maintainPopulations(this.rng, state);

    this.tickEffects(state);
  }

  private rebuildGrid(state: GameState): void {
    this.grid.clear();
    for (const c of state.characters.values()) {
      if (c.alive) this.grid.insert(c.id, c.x, c.y);
    }
  }

  private tickEffects(state: GameState): void {
    for (let i = state.effects.length - 1; i >= 0; i--) {
      state.effects[i].ttl -= 1;
      if (state.effects[i].ttl <= 0) state.effects.splice(i, 1);
    }
  }
}