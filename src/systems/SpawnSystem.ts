// 責務: モンスター個体数を下限〜上限に維持する周期的リスポーン。

import { COUNTS, SPAWN } from '../config/GameConfig';
import { World } from '../world/World';

export class SpawnSystem {
  private timer = 0;

  /** @returns 新規生成されたモンスターID配列(スプライト追加用) */
  update(world: World, gameDtMinutes: number): number[] {
    this.timer += gameDtMinutes;
    if (this.timer < SPAWN.CHECK_INTERVAL_MINUTES) {
      return [];
    }
    this.timer = 0;

    const alive = world.countAlive('monster');
    const created: number[] = [];
    if (alive >= COUNTS.MONSTER_MIN) {
      return created;
    }
    const need = Math.min(
      SPAWN.BATCH,
      COUNTS.MONSTER_MAX - alive
    );
    for (let i = 0; i < need; i++) {
      const pos = world.generator.pickRespawnPosition(
        world.cities,
        world.supplyPosts
      );
      const m = world.generator.createCharacter('monster', pos, world.rng);
      world.characters.push(m);
      created.push(m.id);
    }
    return created;
  }
}