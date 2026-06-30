// File: src/systems/BanditSystem.ts
// 責務: 悪徳NPCの夜盗化・砦建設・配下リクルート・金銭強奪・砦消滅判定を管理する。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { Fort } from '../entities/Fort';
import { GameTime } from '../core/GameTime';
import { EventBus } from '../game/EventBus';
import { EventCategory } from '../ui/EventLog';
import { BanditConfig } from '../config/BehaviorConfig';
import { EntityKind } from '../domain/types';
import { computePower } from '../domain/Stats';
import { RNG } from '../core/RNG';

export interface FortLifecycleHandler {
  onFortCreated(fort: Fort): void;
  onFortDecayed(fort: Fort): void;
}

export class BanditSystem {
  public readonly forts: Fort[];
  private lifecycle: FortLifecycleHandler | null;

  constructor(
    private readonly world: World,
    private readonly time: GameTime,
    private readonly bus: EventBus,
    private readonly rng: RNG,
  ) {
    this.forts = [];
    this.lifecycle = null;
  }

  public setLifecycle(h: FortLifecycleHandler): void {
    this.lifecycle = h;
  }

  public update(): void {
    this.evaluateTurnEvil();
    this.evaluateFortBuild();
    this.evaluateRecruit();
    this.evaluateRob();
    this.evaluateDecay();
  }

  private evaluateTurnEvil(): void {
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Npc || c.isDead() || c.isEvil) {
        continue;
      }
      if (c.inventory.money <= BanditConfig.EVIL_MONEY_THRESHOLD) {
        c.isEvil = true;
        const stamp = this.time.formatStamp();
        c.addHistory(stamp, '困窮の末、夜盗へと身を落とした');
        this.bus.emitWorld({
          stamp,
          text: `${c.fullName} が夜盗化した`,
          category: EventCategory.Death,
          related: [c],
        });
      }
    }
  }

  private evaluateFortBuild(): void {
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Npc || c.isDead() || !c.isEvil) {
        continue;
      }
      if (this.isMember(c.id)) {
        continue;
      }
      if (this.rng.chance(BanditConfig.FORT_BUILD_CHANCE)) {
        const fort = new Fort(c.x, c.y, c.id);
        this.forts.push(fort);
        if (this.lifecycle) {
          this.lifecycle.onFortCreated(fort);
        }
        const stamp = this.time.formatStamp();
        c.addHistory(stamp, '砦を築いた');
        this.bus.emitWorld({
          stamp,
          text: `${c.fullName} が砦を築いた`,
          category: EventCategory.Normal,
          related: [c],
        });
      }
    }
  }

  private evaluateRecruit(): void {
    for (const fort of this.forts) {
      if (fort.decayed) {
        continue;
      }
      const leaderPower = this.fortPower(fort);
      const near = this.world.grid.queryRadius(
        fort.x,
        fort.y,
        BanditConfig.RECRUIT_RANGE,
      );
      for (const c of near) {
        if (c.kind !== EntityKind.Npc || c.isDead() || this.isMember(c.id)) {
          continue;
        }
        if (!c.isEvil) {
          continue;
        }
        const power = computePower(c.attributes, c.skills);
        if (power < leaderPower * BanditConfig.RECRUIT_POWER_RATIO) {
          fort.addMember(c.id);
          const stamp = this.time.formatStamp();
          c.addHistory(stamp, '砦の配下に加わった');
          this.bus.emitWorld({
            stamp,
            text: `${c.fullName} が砦の配下になった`,
            category: EventCategory.Normal,
            related: [c],
          });
        }
      }
    }
  }

  private evaluateRob(): void {
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Npc || c.isDead() || !c.isEvil) {
        continue;
      }
      const near = this.world.grid.queryRadius(c.x, c.y, BanditConfig.ROB_RANGE);
      for (const t of near) {
        if (
          t.id === c.id ||
          t.kind !== EntityKind.Npc ||
          t.isDead() ||
          t.isEvil ||
          t.inventory.money <= 0
        ) {
          continue;
        }
        const amount = Math.min(BanditConfig.ROB_AMOUNT, t.inventory.money);
        t.inventory.money -= amount;
        c.inventory.money += amount;
        const stamp = this.time.formatStamp();
        this.bus.emitWorld({
          stamp,
          text: `${c.fullName} が ${t.fullName} から ${amount} を強奪`,
          category: EventCategory.Money,
          related: [c, t],
        });
        this.bus.emitChat({ stamp, message: '有り金を置いていけ！', speaker: c });
        break;
      }
    }
  }

  private evaluateDecay(): void {
    for (let i = this.forts.length - 1; i >= 0; i--) {
      const fort = this.forts[i];
      if (fort.decayed) {
        continue;
      }
      for (const id of Array.from(fort.memberIds)) {
        const member = this.world.characters.get(id);
        if (!member || member.isDead() || !member.isEvil) {
          fort.removeMember(id);
        }
      }
      if (fort.isEmpty()) {
        fort.decayed = true;
        if (this.lifecycle) {
          this.lifecycle.onFortDecayed(fort);
        }
        const stamp = this.time.formatStamp();
        this.bus.emitWorld({
          stamp,
          text: '所属悪徳NPCが絶え、砦が朽ちて消滅した',
          category: EventCategory.Normal,
          related: [],
        });
        this.forts.splice(i, 1);
      }
    }
  }

  private fortPower(fort: Fort): number {
    let max = 0;
    for (const id of fort.memberIds) {
      const m = this.world.characters.get(id);
      if (m) {
        const p = computePower(m.attributes, m.skills);
        if (p > max) {
          max = p;
        }
      }
    }
    return max;
  }

  private isMember(id: number): boolean {
    for (const fort of this.forts) {
      if (fort.memberIds.has(id)) {
        return true;
      }
    }
    return false;
  }
}