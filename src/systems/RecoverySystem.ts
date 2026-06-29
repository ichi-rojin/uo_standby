// 責務: 都市内/野外でのHP・MP・健康度のスタック回復、都市滞在判定。

import { RECOVERY, STATS_RANGE, WORLD } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { World } from '../world/World';

const CITY_RADIUS = WORLD.TILE_SIZE * 3;

export class RecoverySystem {
  update(world: World, gameDtMinutes: number): void {
    // 都市の滞在集合をクリア
    for (const city of world.cities) {
      city.residents.clear();
    }

    for (const c of world.characters) {
      if (!c.alive) {
        continue;
      }
      const city = this.findCityNear(c, world);
      if (city) {
        c.currentCityId = city.id;
        if (c.kind === 'npc') {
          city.residents.add(c.id);
        }
        this.recoverInCity(c, gameDtMinutes);
      } else {
        c.currentCityId = null;
        this.recoverInField(c, gameDtMinutes);
      }
    }
  }

  private findCityNear(c: Character, world: World) {
    const r2 = CITY_RADIUS * CITY_RADIUS;
    for (const city of world.cities) {
      const dx = city.x - c.x;
      const dy = city.y - c.y;
      if (dx * dx + dy * dy <= r2) {
        return city;
      }
    }
    return null;
  }

  private recoverInCity(c: Character, dt: number): void {
    c.hp = Math.min(c.maxHp, c.hp + RECOVERY.CITY_HP_PER_MIN * dt);
    c.mp = Math.min(c.maxMp, c.mp + RECOVERY.CITY_MP_PER_MIN * dt);
    c.health = Math.min(
      STATS_RANGE.HEALTH_MAX,
      c.health + RECOVERY.CITY_HEALTH_PER_MIN * dt
    );
  }

  private recoverInField(c: Character, dt: number): void {
    c.hp = Math.min(c.maxHp, c.hp + RECOVERY.FIELD_HP_PER_MIN * dt);
    c.mp = Math.min(c.maxMp, c.mp + RECOVERY.FIELD_MP_PER_MIN * dt);
    // 食料がなければ健康度を害する
    if (c.inventory.food <= 0) {
      c.health = Math.max(0, c.health - 0.02 * dt);
    } else {
      c.inventory.food -= 0.005 * dt;
      if (c.inventory.food < 0) {
        c.inventory.food = 0;
      }
    }
  }
}