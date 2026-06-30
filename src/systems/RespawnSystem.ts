// File: src/systems/RespawnSystem.ts
// 責務: モンスター個体数を常時規定範囲に維持するリスポーン制御。

import { World } from '../world/World';
import { WorldGenerator } from '../world/WorldGenerator';
import { PopulationConfig, MonsterConfig } from '../config/GameConfig';

export class RespawnSystem {
  constructor(
    private readonly world: World,
    private readonly generator: WorldGenerator,
  ) {}

  public update(): void {
    const count = this.world.countMonsters();
    if (count >= PopulationConfig.MONSTER_MIN) {
      return;
    }
    const deficit = PopulationConfig.MONSTER_MAX - count;
    const batch = Math.min(MonsterConfig.RESPAWN_BATCH, deficit);
    for (let i = 0; i < batch; i++) {
      const m = this.generator.createMonster();
      this.world.addCharacter(m);
    }
  }
}