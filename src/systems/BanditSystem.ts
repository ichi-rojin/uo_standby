// src/systems/BanditSystem.ts
// 責務: 金欠/性格による夜盗化、砦の建設・配下リクルート、砦の朽ち消滅を日次で処理する。

import { WorldState } from '../world/WorldState';
import type { CharacterData, FortData } from '../domain/types';
import { Allegiance, CharacterKind, LifeState, Personality, EventCategory } from '../domain/enums';
import { BANDIT } from '../config/aiConfig';
import { Rng } from '../util/rng';
import { EventLog } from '../log/EventLog';
import { createFort } from '../entities/Fort';
import { characterDisplayName, refreshEpithet } from '../entities/Character';
import { distanceSq } from '../util/math';
import type { EntityId } from '../domain/ids';

const FORT_DISBAND_DIST_SQ = BANDIT.FORT_BUILD_RADIUS * BANDIT.FORT_BUILD_RADIUS;

export class BanditSystem {
  constructor(
    private readonly log: EventLog,
    private readonly rng: Rng,
  ) {}

  processDaily(world: WorldState): void {
    this.turnNpcsToBandits(world);
    this.recruitWeakBandits(world);
    this.decayEmptyForts(world);
  }

  private turnNpcsToBandits(world: WorldState): void {
    for (const c of world.characters.values()) {
      if (c.kind !== CharacterKind.NPC) continue;
      if (c.state === LifeState.Dead) continue;
      if (c.allegiance === Allegiance.Bandit) continue;
      const broke = c.inventory.gold < BANDIT.GOLD_THRESHOLD;
      const cruel = c.personality === Personality.Cruel || c.personality === Personality.Greedy;
      const probability = (broke ? BANDIT.TURN_BANDIT_CHANCE_PER_DAY : 0) + (cruel ? 0.01 : 0);
      if (probability > 0 && this.rng.chance(probability)) {
        this.makeBandit(world, c);
      }
    }
  }

  private makeBandit(world: WorldState, c: CharacterData): void {
    c.allegiance = Allegiance.Bandit;
    refreshEpithet(c);
    if (c.homeCityId !== null) {
      const city = world.cities.find((x) => x.id === c.homeCityId);
      if (city) city.residentIds.delete(c.id);
      c.homeCityId = null;
    }
    const fort = this.findOrCreateFort(world, c);
    fort.banditIds.add(c.id);
    c.fortId = fort.id;
    this.log.pushEvent(
      world.date,
      EventCategory.Relation,
      `${characterDisplayName(c)} が夜盗に身を落とした`,
      [c.id],
    );
  }

  private findOrCreateFort(world: WorldState, c: CharacterData): FortData {
    let best: FortData | null = null;
    let bestDist = FORT_DISBAND_DIST_SQ;
    for (const fort of world.forts.values()) {
      const d = distanceSq(c.position, fort.position);
      if (d < bestDist) {
        bestDist = d;
        best = fort;
      }
    }
    if (best) return best;
    if (world.forts.size >= BANDIT.FORT_MAX) {
      const any = world.forts.values().next().value as FortData | undefined;
      if (any) return any;
    }
    const fort = createFort({ x: c.position.x, y: c.position.y });
    world.forts.set(fort.id, fort);
    this.log.pushEvent(
      world.date,
      EventCategory.Generic,
      `${characterDisplayName(c)} が砦を築いた`,
      [c.id],
    );
    return fort;
  }

  private recruitWeakBandits(world: WorldState): void {
    for (const fort of world.forts.values()) {
      const leader = this.pickLeader(world, fort);
      if (!leader) continue;
      const near = world.grid.queryRadius(fort.position, BANDIT.FORT_BUILD_RADIUS);
      for (const id of near) {
        const candidate = world.characters.get(id);
        if (!candidate) continue;
        if (candidate.kind !== CharacterKind.NPC) continue;
        if (candidate.state === LifeState.Dead) continue;
        if (candidate.allegiance === Allegiance.Bandit) continue;
        const weak = candidate.attr.build < leader.attr.build * BANDIT.RECRUIT_STRENGTH_RATIO;
        if (weak && this.rng.chance(0.02)) {
          candidate.allegiance = Allegiance.Bandit;
          refreshEpithet(candidate);
          candidate.fortId = fort.id;
          fort.banditIds.add(candidate.id);
          this.log.pushEvent(
            world.date,
            EventCategory.Relation,
            `${characterDisplayName(candidate)} が砦の配下となった`,
            [candidate.id, leader.id],
          );
        }
      }
    }
  }

  private pickLeader(world: WorldState, fort: FortData): CharacterData | null {
    let leader: CharacterData | null = null;
    for (const id of fort.banditIds) {
      const c = world.characters.get(id);
      if (!c || c.state === LifeState.Dead) continue;
      if (!leader || c.attr.build > leader.attr.build) leader = c;
    }
    return leader;
  }

  private decayEmptyForts(world: WorldState): void {
    const toRemove: EntityId[] = [];
    for (const fort of world.forts.values()) {
      let aliveBandits = 0;
      for (const id of fort.banditIds) {
        const c = world.characters.get(id);
        if (c && c.state === LifeState.Alive && c.allegiance === Allegiance.Bandit) {
          aliveBandits += 1;
        } else {
          fort.banditIds.delete(id);
        }
      }
      if (aliveBandits === 0) {
        toRemove.push(fort.id);
      }
    }
    for (const id of toRemove) {
      world.forts.delete(id);
      this.log.pushEvent(world.date, EventCategory.Generic, `砦が朽ちて消滅した`, []);
    }
  }
}