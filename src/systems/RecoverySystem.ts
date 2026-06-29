// src/systems/RecoverySystem.ts
// 責務: 都市内での HP/MP/健康度回復・装備食料整備・スキル習得、および野外スタック回復と飢餓処理を担う。

import { WorldState } from '../world/WorldState';
import type { CharacterData, CityData } from '../domain/types';
import { RECOVERY } from '../config/aiConfig';
import { EventLog } from '../log/EventLog';
import { EventCategory, LifeState } from '../domain/enums';
import { Rng } from '../util/rng';
import { characterDisplayName } from '../entities/Character';
import { cloneDate } from '../util/time';
import { clamp } from '../util/math';

const SKILL_LEARN_CHANCE = 0.02;
const SKILL_GAIN = 1;

export class RecoverySystem {
  constructor(
    private readonly log: EventLog,
    private readonly rng: Rng,
  ) {}

  recoverInCity(world: WorldState, c: CharacterData, city: CityData, dt: number): boolean {
    c.attr.hp = clamp(c.attr.hp + RECOVERY.CITY_HP_PER_SEC * dt, 0, c.attr.maxHp);
    c.attr.mp = clamp(c.attr.mp + RECOVERY.CITY_MP_PER_SEC * dt, 0, c.attr.maxMp);
    c.attr.health = clamp(c.attr.health + RECOVERY.CITY_HEALTH_PER_SEC * dt, 0, 100);

    if (c.inventory.food < 8) {
      c.inventory.food += 1;
    }
    if (c.inventory.gold >= 10 && this.rng.chance(SKILL_LEARN_CHANCE)) {
      c.inventory.gold -= 10;
      c.skills.sword += SKILL_GAIN;
      c.history.push({
        date: cloneDate(world.date),
        text: `剣のスキルを習得`,
      });
      this.log.pushEvent(
        world.date,
        EventCategory.Generic,
        `${characterDisplayName(c)} が ${city.name} で剣技を磨いた`,
        [c.id],
      );
    }

    if (c.homeCityId !== city.id && c.homeCityId !== null) {
      c.homeCityId = city.id;
    }
    city.residentIds.add(c.id);

    const fullyRecovered = c.attr.hp >= c.attr.maxHp * 0.95 && c.attr.health >= 90;
    return fullyRecovered;
  }

  applyFieldRecoveryAndStarvation(world: WorldState): void {
    for (const c of world.characters.values()) {
      if (c.state === LifeState.Dead) continue;
      c.attr.hp = clamp(c.attr.hp + RECOVERY.FIELD_HP_PER_SEC, 0, c.attr.maxHp);
      c.attr.mp = clamp(c.attr.mp + RECOVERY.FIELD_MP_PER_SEC, 0, c.attr.maxMp);
      if (c.inventory.food > 0) {
        c.inventory.food -= RECOVERY.FOOD_PER_DAY;
      } else {
        c.attr.health = clamp(c.attr.health - RECOVERY.STARVE_HEALTH_LOSS, 0, 100);
      }
    }
  }
}