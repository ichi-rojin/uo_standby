// 責務: キャラクターの移動・徘徊目的地選定・無行動禁止の強制再設定。

import { MOVEMENT, RECOVERY, WORLD } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { Rng } from '../core/Rng';
import { World } from '../world/World';

export class MovementSystem {
  constructor(private readonly rng: Rng) {}

  /** gameDtMinutes: このフレームで進んだゲーム内分 */
  update(world: World, gameDtMinutes: number): void {
    const gameDtSeconds = gameDtMinutes * 60;
    for (const c of world.characters) {
      if (!c.alive) {
        continue;
      }
      this.stepCharacter(c, world, gameDtMinutes, gameDtSeconds);
    }
  }

  private stepCharacter(
    c: Character,
    world: World,
    dtMin: number,
    dtSec: number
  ): void {
    c.wanderTimer -= dtMin;
    c.idleMinutes += dtMin;

    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= MOVEMENT.ARRIVE_DIST || c.wanderTimer <= 0) {
      this.pickDestination(c, world);
      c.wanderTimer = MOVEMENT.WANDER_REPICK_MINUTES;
    }

    if (c.idleMinutes >= RECOVERY.IDLE_LIMIT_MINUTES) {
      // 無行動禁止: 強制的に新目的地
      this.pickDestination(c, world);
      c.idleMinutes = 0;
    }

    if (dist > MOVEMENT.ARRIVE_DIST) {
      const step = c.speed * dtSec;
      const nx = (dx / dist) * step;
      const ny = (dy / dist) * step;
      c.x = this.clampWorld(c.x + nx, WORLD.WIDTH_TILES);
      c.y = this.clampWorld(c.y + ny, WORLD.HEIGHT_TILES);
      c.idleMinutes = 0;
    }
  }

  private pickDestination(c: Character, world: World): void {
    if (c.kind === 'npc') {
      // 帰属度が高いほど都市付近を目的地にする
      if (this.rng.next() < c.cityAttachment && world.cities.length > 0) {
        const city = this.rng.pick(world.cities);
        c.targetX = city.x + this.rng.range(-WORLD.TILE_SIZE * 2, WORLD.TILE_SIZE * 2);
        c.targetY = city.y + this.rng.range(-WORLD.TILE_SIZE * 2, WORLD.TILE_SIZE * 2);
        return;
      }
    }
    const range = WORLD.TILE_SIZE * 30;
    c.targetX = this.clampWorld(
      c.x + this.rng.range(-range, range),
      WORLD.WIDTH_TILES
    );
    c.targetY = this.clampWorld(
      c.y + this.rng.range(-range, range),
      WORLD.HEIGHT_TILES
    );
  }

  private clampWorld(v: number, tiles: number): number {
    const min = WORLD.EDGE_MARGIN_TILES * WORLD.TILE_SIZE;
    const max = (tiles - WORLD.EDGE_MARGIN_TILES) * WORLD.TILE_SIZE;
    return Math.min(max, Math.max(min, v));
  }
}