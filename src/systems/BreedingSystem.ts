// src/systems/BreedingSystem.ts
// 責務: 恋愛関係NPCの交配判定、子の都市格納（pendingChildren）、10年後のNPC化（出生）を処理する。

import { WorldState } from '../world/WorldState';
import type { CharacterData, CityData, PendingChild } from '../domain/types';
import { Allegiance, CharacterKind, LifeState, EventCategory } from '../domain/enums';
import { BREEDING, RELATION } from '../config/aiConfig';
import { Rng } from '../util/rng';
import { EventLog } from '../log/EventLog';
import { RelationGraph } from '../social/RelationGraph';
import { createChildCharacter, characterDisplayName } from '../entities/Character';
import { cloneDate } from '../util/time';
import { TIME } from '../config/constants';
import { pickSpawnPosition } from './SpawnSystem';
import { npcTint } from '../render/ColorUtil';
import { distanceSq } from '../util/math';

const ENCOUNTER_RADIUS = 130;
const ENCOUNTER_RADIUS_SQ = ENCOUNTER_RADIUS * ENCOUNTER_RADIUS;

export class BreedingSystem {
  constructor(
    private readonly log: EventLog,
    private readonly relations: RelationGraph,
    private readonly rng: Rng,
  ) {}

  processDaily(world: WorldState): void {
    this.attemptBreeding(world);
    this.matureChildren(world);
    this.tickCooldowns(world);
  }

  private tickCooldowns(world: WorldState): void {
    for (const c of world.characters.values()) {
      if (c.breedingCooldownDays > 0) c.breedingCooldownDays -= 1;
    }
  }

  private attemptBreeding(world: WorldState): void {
    const handled = new Set<string>();
    for (const a of world.characters.values()) {
      if (!this.isBreedable(a)) continue;
      const near = world.grid.queryRadius(a.position, ENCOUNTER_RADIUS);
      for (const id of near) {
        if (id === a.id) continue;
        const b = world.characters.get(id);
        if (!b || !this.isBreedable(b)) continue;
        const pairKey = a.id < b.id ? `${a.id}_${b.id}` : `${b.id}_${a.id}`;
        if (handled.has(pairKey)) continue;
        handled.add(pairKey);
        if (distanceSq(a.position, b.position) > ENCOUNTER_RADIUS_SQ) continue;
        const love = this.relations.get(a.id, b.id);
        if (love < RELATION.LOVE_THRESHOLD) continue;
        if (!this.rng.chance(BREEDING.CHANCE_PER_ENCOUNTER)) continue;
        this.breed(world, a, b);
      }
    }
  }

  private isBreedable(c: CharacterData): boolean {
    return (
      c.kind === CharacterKind.NPC &&
      c.state === LifeState.Alive &&
      c.allegiance === Allegiance.Citizen &&
      c.attr.health >= BREEDING.MIN_HEALTH &&
      c.breedingCooldownDays <= 0
    );
  }

  private breed(world: WorldState, a: CharacterData, b: CharacterData): void {
    a.breedingCooldownDays = BREEDING.COOLDOWN_DAYS;
    b.breedingCooldownDays = BREEDING.COOLDOWN_DAYS;

    const city = this.pickCity(world, a, b);
    if (!city) return;

    const child: PendingChild = {
      parentAId: a.id,
      parentBId: b.id,
      birth: cloneDate(world.date),
      matureYear: world.date.year + BREEDING.CHILD_MATURE_YEARS,
      tint: npcTint(this.rng),
    };
    city.pendingChildren.push(child);

    const nameA = characterDisplayName(a);
    const nameB = characterDisplayName(b);
    a.history.push({ date: cloneDate(world.date), text: `${nameB} と交配` });
    b.history.push({ date: cloneDate(world.date), text: `${nameA} と交配` });
    this.log.pushEvent(
      world.date,
      EventCategory.Relation,
      `${nameA} と ${nameB} が結ばれ、子を授かった`,
      [a.id, b.id],
    );
  }

  private pickCity(world: WorldState, a: CharacterData, _b: CharacterData): CityData | null {
    if (a.homeCityId !== null) {
      const city = world.cities.find((x) => x.id === a.homeCityId);
      if (city) return city;
    }
    if (world.cities.length === 0) return null;
    return world.cities[this.rng.int(0, world.cities.length - 1)];
  }

  private matureChildren(world: WorldState): void {
    for (const city of world.cities) {
      if (city.pendingChildren.length === 0) continue;
      const remaining: PendingChild[] = [];
      for (const child of city.pendingChildren) {
        const matured =
          world.date.year > child.matureYear ||
          (world.date.year === child.matureYear &&
            world.date.month >= child.birth.month &&
            world.date.day >= child.birth.day);
        if (matured) {
          this.spawnChild(world, city, child);
        } else {
          remaining.push(child);
        }
      }
      city.pendingChildren = remaining;
    }
  }

  private spawnChild(world: WorldState, city: CityData, child: PendingChild): void {
    const pos = pickSpawnPosition(world, this.rng);
    const npc = createChildCharacter(this.rng, pos, child.tint, city.id);
    npc.history.push({
      date: cloneDate(world.date),
      text: `${city.name} で誕生した`,
    });
    world.addCharacter(npc);
    city.residentIds.add(npc.id);
    city.population += 1;
    this.log.pushEvent(
      world.date,
      EventCategory.Relation,
      `${characterDisplayName(npc)} が成人し ${city.name} を旅立った`,
      [npc.id],
    );
  }
}

export const BREEDING_TIME = {
  YEAR_REF: TIME.MONTHS_PER_YEAR,
} as const;