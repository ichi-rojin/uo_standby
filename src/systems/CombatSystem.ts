// File: src/systems/CombatSystem.ts
// 責務: 近接・魔法攻撃の判定とダメージ計算、死亡処理、戦利品付与、エフェクト/ログ発火。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { GameTime } from '../core/GameTime';
import { EventBus, FxKind } from '../game/EventBus';
import { EventCategory } from '../ui/EventLog';
import { EntityKind, CharacterState, WeaponType } from '../domain/types';
import { CombatConfig } from '../config/BehaviorConfig';
import { StatsConfig } from '../config/GameConfig';
import { healthDebuffFactor } from '../domain/Stats';
import { RNG } from '../core/RNG';
import { RelationSystem } from './RelationSystem';

export class CombatSystem {
  private readonly lastAttack: Map<number, number>;

  constructor(
    private readonly world: World,
    private readonly time: GameTime,
    private readonly bus: EventBus,
    private readonly rng: RNG,
    private readonly relations: RelationSystem,
  ) {
    this.lastAttack = new Map();
  }

  public tryAttack(attacker: Character, target: Character): void {
    if (attacker.isDead() || target.isDead()) {
      return;
    }
    const dist = Math.hypot(target.x - attacker.x, target.y - attacker.y);
    if (dist > CombatConfig.ATTACK_RANGE) {
      return;
    }
    const last = this.lastAttack.get(attacker.id) ?? -9999;
    if (this.time.getTotalHours() - last < CombatConfig.ATTACK_COOLDOWN_HOURS) {
      return;
    }
    this.lastAttack.set(attacker.id, this.time.getTotalHours());
    attacker.state = CharacterState.Fighting;

    const damage = this.computeDamage(attacker);
    target.hp -= damage;
    target.health = Math.max(0, target.health - CombatConfig.HEALTH_HIT_ON_DAMAGE);

    this.bus.emitFx({ kind: FxKind.Damage, x: target.x, y: target.y, amount: damage });

    if (target.kind === EntityKind.Npc && attacker.kind === EntityKind.Npc) {
      this.relations.onAttacked(target, attacker);
    }

    if (target.hp <= 0) {
      this.kill(attacker, target);
    }
  }

  private computeDamage(attacker: Character): number {
    const skill = this.weaponSkill(attacker);
    const factor = healthDebuffFactor(attacker.health);
    const raw =
      CombatConfig.BASE_DAMAGE +
      skill * CombatConfig.DAMAGE_SKILL_SCALE +
      attacker.attributes.physique * CombatConfig.DAMAGE_PHYSIQUE_SCALE;
    return Math.max(1, Math.round(raw * factor));
  }

  private weaponSkill(c: Character): number {
    switch (c.inventory.weapon) {
      case WeaponType.Sword:
        return c.skills.sword;
      case WeaponType.Polearm:
        return c.skills.polearm;
      case WeaponType.Bow:
        return c.skills.bow;
      default:
        return 0;
    }
  }

  private kill(attacker: Character, target: Character): void {
    target.hp = 0;
    target.state = CharacterState.Dead;
    target.deathTimer = 0;

    const stamp = this.time.formatStamp();
    const targetName = target.kind === EntityKind.Npc ? target.fullName : '魔物';
    this.bus.emitWorld({
      stamp,
      text: `${attacker.kind === EntityKind.Npc ? attacker.fullName : '魔物'} が ${targetName} を討伐`,
      category: EventCategory.Death,
      related: [attacker, target],
    });

    attacker.addHistory(stamp, `${targetName}を討伐`);

    if (target.kind === EntityKind.Npc) {
      this.bus.emitChat({
        stamp,
        message: this.rng.pick(['ぐ…無念…', 'あとは…頼む…', 'こんな所で…']),
        speaker: target,
      });
    }

    if (attacker.kind === EntityKind.Npc) {
      attacker.inventory.food += CombatConfig.FOOD_GAIN_ON_KILL;
      if (target.isEvil || target.kind === EntityKind.Monster) {
        attacker.inventory.money += CombatConfig.MONEY_GAIN_ON_KILL;
        this.bus.emitWorld({
          stamp,
          text: `${attacker.fullName} が ${CombatConfig.MONEY_GAIN_ON_KILL} の金銭を獲得`,
          category: EventCategory.Money,
          related: [attacker],
        });
      }
      if (this.rng.chance(CombatConfig.VALUABLE_DROP_CHANCE)) {
        attacker.inventory.valuables += 1;
        attacker.addHistory(stamp, '値打ちものを手に入れた');
        this.bus.emitWorld({
          stamp,
          text: `${attacker.fullName} が値打ちものを手に入れた`,
          category: EventCategory.Treasure,
          related: [attacker],
        });
      }
      this.growSkill(attacker, stamp);
    }

    this.lastAttack.delete(target.id);
  }

  private growSkill(c: Character, stamp: string): void {
    const gain = 1;
    if (c.inventory.weapon === WeaponType.Sword && c.skills.sword < StatsConfig.SKILL_MAX) {
      c.skills.sword += gain;
      c.addHistory(stamp, `剣のスキルが${gain}上がった`);
    }
  }
}