// src/systems/CombatSystem.ts
// 責務: ダメージ計算・命中処理・死亡判定・履歴/ログ/エフェクト/感情変化を担う戦闘中核。

import { WorldState } from '../world/WorldState';
import type { CharacterData } from '../domain/types';
import { LifeState, CharacterKind, EventCategory, WeaponType, Allegiance } from '../domain/enums';
import { COMBAT, RELATION, CHAT } from '../config/aiConfig';
import { DEATH } from '../config/constants';
import { Rng } from '../util/rng';
import { EffectSystem } from './EffectSystem';
import { EventLog } from '../log/EventLog';
import { RelationGraph } from '../social/RelationGraph';
import { characterDisplayName } from '../entities/Character';
import { combatShout, deathLine } from '../social/ChatGenerator';
import { cloneDate } from '../util/time';

function weaponSkill(c: CharacterData): number {
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

function computeDamage(attacker: CharacterData, defender: CharacterData, rng: Rng): number {
  const power =
    COMBAT.BASE_DAMAGE +
    attacker.attr.build * COMBAT.STRENGTH_SCALE +
    weaponSkill(attacker) * COMBAT.SKILL_SCALE;
  const defense = defender.attr.reaction * COMBAT.DEFENSE_SCALE;
  let dmg = Math.max(1, power - defense);
  if (rng.chance(COMBAT.CRIT_CHANCE)) {
    dmg *= COMBAT.CRIT_MULT;
  }
  dmg *= rng.range(0.85, 1.15);
  return Math.round(dmg);
}

export class CombatSystem {
  constructor(
    private readonly effects: EffectSystem,
    private readonly log: EventLog,
    private readonly relations: RelationGraph,
    private readonly rng: Rng,
  ) {}

  resolveAttack(world: WorldState, attacker: CharacterData, defender: CharacterData): void {
    if (attacker.state === LifeState.Dead || defender.state === LifeState.Dead) return;
    if (attacker.attackCooldown > 0) return;
    attacker.attackCooldown = COMBAT.ATTACK_COOLDOWN;

    if (this.rng.chance(CHAT.COMBAT_SHOUT_CHANCE)) {
      this.log.pushChat(
        world.date,
        attacker.id,
        characterDisplayName(attacker),
        combatShout(this.rng, defender),
      );
    }

    const dmg = computeDamage(attacker, defender, this.rng);
    defender.attr.hp -= dmg;
    defender.attr.health = Math.max(0, defender.attr.health - COMBAT.HEALTH_LOSS_ON_HIT);
    this.effects.spawnDamage(world, defender.position, dmg);

    if (defender.attr.hp <= 0) {
      this.handleDeath(world, attacker, defender);
    } else {
      defender.combatTargetId = attacker.id;
    }
  }

  private handleDeath(world: WorldState, attacker: CharacterData, victim: CharacterData): void {
    victim.attr.hp = 0;
    victim.state = LifeState.Dead;
    victim.deadTimer = DEATH.GRAYSCALE_SECONDS;
    victim.combatTargetId = null;
    victim.plan = [];

    this.log.pushChat(world.date, victim.id, characterDisplayName(victim), deathLine(this.rng));

    const victimName = characterDisplayName(victim);
    const attackerName = characterDisplayName(attacker);
    this.log.pushEvent(
      world.date,
      EventCategory.Death,
      `${attackerName} が ${victimName} を討伐した`,
      [attacker.id, victim.id],
    );

    attacker.history.push({
      date: cloneDate(world.date),
      text: `${victimName} を討伐`,
    });

    if (victim.kind !== CharacterKind.NPC) {
      const loot = this.rng.int(5, 30);
      attacker.inventory.gold += loot;
      attacker.inventory.food += 1;
      attacker.history.push({
        date: cloneDate(world.date),
        text: `${victimName} を捕食`,
      });
    } else {
      attacker.inventory.gold += victim.inventory.gold;
      attacker.inventory.valuables += victim.inventory.valuables;
    }

    this.propagateGrief(world, attacker, victim);
  }

  private propagateGrief(world: WorldState, killer: CharacterData, victim: CharacterData): void {
    if (victim.kind !== CharacterKind.NPC || killer.kind !== CharacterKind.NPC) return;
    const near = world.grid.queryRadius(victim.position, 400);
    for (const id of near) {
      if (id === killer.id || id === victim.id) continue;
      const witness = world.characters.get(id);
      if (!witness || witness.kind !== CharacterKind.NPC) continue;
      const bond = this.relations.get(witness.id, victim.id);
      if (bond > RELATION.FRIEND_THRESHOLD) {
        this.relations.adjust(witness.id, killer.id, -RELATION.KILL_RELATED_HATE);
        this.log.pushEvent(
          world.date,
          EventCategory.Relation,
          `${characterDisplayName(witness)} が ${characterDisplayName(killer)} を深く憎んだ`,
          [witness.id, killer.id],
        );
      }
    }
  }

  cooldownAll(world: WorldState, dt: number): void {
    for (const c of world.characters.values()) {
      if (c.attackCooldown > 0) c.attackCooldown = Math.max(0, c.attackCooldown - dt);
    }
  }

  banditRob(world: WorldState, robber: CharacterData, victim: CharacterData): void {
    if (victim.state === LifeState.Dead) return;
    if (robber.allegiance !== Allegiance.Bandit) return;
    const amount = Math.round(victim.inventory.gold * 0.5);
    if (amount <= 0) {
      this.resolveAttack(world, robber, victim);
      return;
    }
    victim.inventory.gold -= amount;
    robber.inventory.gold += amount;
    this.effects.spawnDebuff(world, victim.position);
    this.log.pushEvent(
      world.date,
      EventCategory.Money,
      `${characterDisplayName(robber)} が ${characterDisplayName(victim)} から ${amount} 金を強奪`,
      [robber.id, victim.id],
    );
    this.relations.adjust(victim.id, robber.id, -RELATION.KILL_RELATED_HATE / 2);
  }
}