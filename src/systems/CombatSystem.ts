// 責務: 近傍探索による戦闘判定。ダメージ算出・エフェクト発火・ログ/会話生成。

import { COMBAT } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { effectiveAttack, effectiveDefense } from '../domain/Stats';
import { Rng } from '../core/Rng';
import { World } from '../world/World';
import { EffectLayer } from '../render/EffectLayer';
import { EventLog } from '../logging/EventLog';
import { ConversationLog } from '../logging/ConversationLog';
import { GameClock } from '../core/GameClock';

const MONSTER_SHOUTS = [
  'グルァァ！',
  'シャアアア！',
  'ギギギ…',
  'ウォオオン！',
  'キシャアア！',
] as const;

const NPC_BATTLE_CRIES = [
  '覚悟しろ！',
  '我が剣を受けよ！',
  '退けぬ戦いだ！',
  'ここで仕留める！',
  '名にかけて！',
] as const;

export interface CombatDeps {
  effects: EffectLayer;
  eventLog: EventLog;
  conversationLog: ConversationLog;
  clock: GameClock;
}

export class CombatSystem {
  private readonly neighbors: Character[] = [];

  constructor(
    private readonly rng: Rng,
    private readonly deps: CombatDeps
  ) {}

  update(world: World, gameDtMinutes: number): void {
    for (const c of world.characters) {
      if (!c.alive) {
        continue;
      }
      if (c.attackCooldown > 0) {
        c.attackCooldown -= gameDtMinutes;
        continue;
      }
      const target = this.findTarget(c, world);
      if (target) {
        this.resolveAttack(c, target, world);
        c.attackCooldown = COMBAT.ATTACK_COOLDOWN_MINUTES;
      }
    }
  }

  private isHostile(a: Character, b: Character): boolean {
    if (a.id === b.id) {
      return false;
    }
    // モンスター↔NPC、夜盗↔市民 を敵対とする
    if (a.kind === 'monster' && b.kind !== 'monster') {
      return true;
    }
    if (a.kind !== 'monster' && b.kind === 'monster') {
      return true;
    }
    if (a.faction === 'bandit' && b.faction === 'civil') {
      return true;
    }
    if (a.faction === 'civil' && b.faction === 'bandit') {
      return true;
    }
    return false;
  }

  private findTarget(c: Character, world: World): Character | null {
    world.grid.queryRadius(c.x, c.y, COMBAT.AGGRO_RANGE, this.neighbors);
    let best: Character | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const n of this.neighbors) {
      if (!n.alive || !this.isHostile(c, n)) {
        continue;
      }
      const d = (n.x - c.x) ** 2 + (n.y - c.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    if (best) {
      const realDist = Math.sqrt(bestDist);
      if (realDist <= COMBAT.ATTACK_RANGE) {
        return best;
      }
      // 範囲外なら接近(目的地を敵に)
      c.targetX = best.x;
      c.targetY = best.y;
    }
    return realDistInRange(best, c) ? best : null;
  }

  private resolveAttack(
    attacker: Character,
    target: Character,
    world: World
  ): void {
    const atk = effectiveAttack(
      attacker.attributes,
      attacker.skills,
      attacker.health
    );
    const def = effectiveDefense(target.attributes, target.health);
    const raw = (atk - def * 0.5) * COMBAT.DAMAGE_SCALE;
    const dmg = Math.max(COMBAT.MIN_DAMAGE, Math.round(raw));

    target.hp -= dmg;
    this.deps.effects.spawnDamageText(target.x, target.y, dmg, false);
    this.deps.effects.spawnHitFlash(target.x, target.y);

    this.emitBattleCry(attacker);

    if (target.hp <= 0) {
      this.handleDeath(attacker, target, world);
    }
  }

  private emitBattleCry(attacker: Character): void {
    if (!this.rng.chance(0.08)) {
      return;
    }
    if (attacker.kind === 'monster') {
      this.deps.conversationLog.push(
        attacker.id,
        attacker.displayName,
        this.rng.pick(MONSTER_SHOUTS),
        [attacker.id]
      );
    } else {
      this.deps.conversationLog.push(
        attacker.id,
        attacker.displayName,
        this.rng.pick(NPC_BATTLE_CRIES),
        [attacker.id]
      );
    }
  }

  private handleDeath(
    killer: Character,
    victim: Character,
    world: World
  ): void {
    victim.alive = false;
    victim.hp = 0;
    victim.deathMinute = this.deps.clock.getTotalMinutes();

    const prefix = this.deps.clock.formatLogPrefix();
    this.deps.eventLog.push(
      `${prefix}、${killer.displayName} が ${victim.displayName} を討伐した`,
      'death',
      [killer.id, victim.id]
    );
    killer.addHistory({
      text: `${prefix}${victim.displayName}を討伐`,
    });

    // 断末魔
    this.deps.conversationLog.push(
      victim.id,
      victim.displayName,
      victim.kind === 'monster' ? 'ギャアアア…' : '無念…',
      [victim.id, killer.id]
    );

    // 値打ちもの/金銭の移譲(簡易)
    if (victim.inventory.gold > 0) {
      killer.inventory.gold += victim.inventory.gold;
      this.deps.eventLog.push(
        `${prefix}、${killer.displayName} が ${victim.inventory.gold} の金銭を得た`,
        'money',
        [killer.id]
      );
      victim.inventory.gold = 0;
    }
  }
}

/** 攻撃射程内かを判定(可読性のため関数化) */
function realDistInRange(target: Character | null, c: Character): boolean {
  if (!target) {
    return false;
  }
  const d = Math.hypot(target.x - c.x, target.y - c.y);
  return d <= COMBAT.ATTACK_RANGE;
}