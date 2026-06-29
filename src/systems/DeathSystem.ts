// src/systems/DeathSystem.ts
// 責務: 死亡キャラクターのグレースケール表示タイマー管理と一定時間経過後の除去を担う。

import { WorldState } from '../world/WorldState';
import { LifeState } from '../domain/enums';
import type { EntityId } from '../domain/ids';

export class DeathSystem {
  update(world: WorldState, dt: number): void {
    const toRemove: EntityId[] = [];
    for (const c of world.characters.values()) {
      if (c.state !== LifeState.Dead) continue;
      c.deadTimer -= dt;
      if (c.deadTimer <= 0) {
        toRemove.push(c.id);
      }
    }
    for (const id of toRemove) {
      const c = world.characters.get(id);
      if (c && c.homeCityId !== null) {
        const city = world.cities.find((x) => x.id === c.homeCityId);
        if (city) city.residentIds.delete(id);
      }
      world.removeCharacter(id);
    }
  }
}