// File: src/systems/RecoverySystem.ts
// 責務: HP/MP/健康度のスタック回復処理。都市滞在時は高速回復する。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { EntityKind, CharacterState } from '../domain/types';
import { RecoveryConfig, StatsConfig } from '../config/GameConfig';

export class RecoverySystem {
  constructor(private readonly world: World) {}

  public update(elapsedHours: number): void {
    if (elapsedHours <= 0) {
      return;
    }
    for (const c of this.world.characters.values()) {
      if (c.isDead()) {
        continue;
      }
      const inCity = this.isInCity(c);
      if (inCity) {
        this.recover(
          c,
          RecoveryConfig.CITY_HP_PER_HOUR * elapsedHours,
          RecoveryConfig.CITY_MP_PER_HOUR * elapsedHours,
          RecoveryConfig.CITY_HEALTH_PER_HOUR * elapsedHours,
        );
      } else {
        this.recover(
          c,
          RecoveryConfig.STACK_HEAL_HP_PER_HOUR * elapsedHours,
          RecoveryConfig.STACK_HEAL_MP_PER_HOUR * elapsedHours,
          0,
        );
      }
    }
  }

  private isInCity(c: Character): boolean {
    if (c.kind !== EntityKind.Npc) {
      return false;
    }
    return c.state === CharacterState.Resting;
  }

  private recover(c: Character, hp: number, mp: number, health: number): void {
    c.hp = Math.min(c.hpMax, c.hp + hp);
    c.mp = Math.min(c.mpMax, c.mp + mp);
    c.health = Math.min(StatsConfig.HEALTH_MAX, c.health + health);
  }
}