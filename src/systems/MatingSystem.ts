// File: src/systems/MatingSystem.ts
// 責務: 恋愛関係にある異性NPCの交配、子の都市格納、10年後の成人NPC化を管理する。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { City } from '../entities/City';
import { GameTime } from '../core/GameTime';
import { EventBus } from '../game/EventBus';
import { EventCategory } from '../ui/EventLog';
import { RelationSystem } from './RelationSystem';
import { RelationType } from '../domain/Relations';
import { MatingConfig } from '../config/BehaviorConfig';
import { EntityKind, Gender } from '../domain/types';
import { TimeConfig, StatsConfig } from '../config/GameConfig';
import { RNG } from '../core/RNG';
import { WorldGenerator } from '../world/WorldGenerator';

interface MatureResult {
  city: City;
  gender: Gender;
}

export class MatingSystem {
  private readonly cooldown: Map<number, number>;

  constructor(
    private readonly world: World,
    private readonly time: GameTime,
    private readonly bus: EventBus,
    private readonly relations: RelationSystem,
    private readonly rng: RNG,
    private readonly generator: WorldGenerator,
  ) {
    this.cooldown = new Map();
  }

  public update(): void {
    this.evaluateMating();
    this.evaluateMaturation();
  }

  private evaluateMating(): void {
    for (const c of this.world.characters.values()) {
      if (!this.canMate(c)) {
        continue;
      }
      const near = this.world.grid.queryRadius(c.x, c.y, MatingConfig.MATE_RANGE);
      for (const other of near) {
        if (other.id === c.id || !this.canMate(other)) {
          continue;
        }
        if (c.gender === other.gender) {
          continue;
        }
        if (
          this.relations.store.classify(c.id, other.id) !== RelationType.Love ||
          this.relations.store.classify(other.id, c.id) !== RelationType.Love
        ) {
          continue;
        }
        this.mate(c, other);
        break;
      }
    }
  }

  private canMate(c: Character): boolean {
    if (c.kind !== EntityKind.Npc || c.isDead()) {
      return false;
    }
    if (c.health < MatingConfig.MATE_HEALTH_REQUIRED) {
      return false;
    }
    const last = this.cooldown.get(c.id) ?? -99999;
    return this.time.getTotalHours() - last >= MatingConfig.MATE_COOLDOWN_HOURS;
  }

  private mate(a: Character, b: Character): void {
    const now = this.time.getTotalHours();
    this.cooldown.set(a.id, now);
    this.cooldown.set(b.id, now);

    const city = this.nearestCity(a.x, a.y);
    const childGender = this.rng.chance(0.5) ? Gender.Male : Gender.Female;
    city.storedChildren.push({ bornHour: now, gender: childGender });
    city.population += 1;

    const stamp = this.time.formatStamp();
    a.addHistory(stamp, `${b.fullName}と交配した`);
    b.addHistory(stamp, `${a.fullName}と交配した`);
    this.bus.emitWorld({
      stamp,
      text: `${a.fullName} と ${b.fullName} が交配し、子が ${city.name} に預けられた`,
      category: EventCategory.Relation,
      related: [a, b],
    });
    this.bus.emitChat({ stamp, message: '新たな命をこの世に', speaker: a });
  }

  private evaluateMaturation(): void {
    const hoursPerYear =
      TimeConfig.HOURS_PER_DAY * TimeConfig.DAYS_PER_MONTH * TimeConfig.MONTHS_PER_YEAR;
    const matureHours = MatingConfig.CHILD_MATURE_YEARS * hoursPerYear;
    const matured: MatureResult[] = [];
    for (const city of this.world.cities) {
      for (let i = city.storedChildren.length - 1; i >= 0; i--) {
        const child = city.storedChildren[i];
        if (this.time.getTotalHours() - child.bornHour >= matureHours) {
          matured.push({ city, gender: child.gender === 0 ? Gender.Male : Gender.Female });
          city.storedChildren.splice(i, 1);
        }
      }
    }
    for (const m of matured) {
      this.spawnAdult(m);
    }
  }

  private spawnAdult(m: MatureResult): void {
    const npc = this.generator.createNpc(this.world.cities, this.world.supplies);
    npc.x = m.city.x;
    npc.y = m.city.y;
    this.world.addCharacter(npc);
    const stamp = this.time.formatStamp();
    this.bus.emitWorld({
      stamp,
      text: `${m.city.name} で育った子が ${npc.fullName} として世に出た`,
      category: EventCategory.Relation,
      related: [npc],
    });
  }

  private nearestCity(x: number, y: number): City {
    let best = this.world.cities[0];
    let bestD = Infinity;
    for (const c of this.world.cities) {
      const dx = c.x - x;
      const dy = c.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  public static unusedGuard(): number {
    return StatsConfig.HEALTH_MAX;
  }
}