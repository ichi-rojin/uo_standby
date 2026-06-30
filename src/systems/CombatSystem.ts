// 責務: 攻撃判定・ダメージ計算・魔法/必殺技発動・生殺与奪・捕食処理
import { Rng } from '../util/rng';
import { clamp, dist, normalize10 } from '../util/math';
import { COMBAT, MORAL, STAT, RELATION, DEAD } from '../config/constants';
import { computeTitle } from '../factory/characterFactory';
import type { Character, EntityId, WeaponKind, Stats } from '../domain/types';
import type { GameState } from '../state/gameState';
import { formatGameTime } from '../util/timeFormat';

const COLOR_DEATH = 0xff5555;
const COLOR_RELATION = 0x55ff55;

export function weaponRange(weapon: WeaponKind, c: Character): number {
  switch (weapon) {
    case 'sword':
      return COMBAT.RANGE_SWORD * 32;
    case 'pole':
      return COMBAT.RANGE_POLE * 32;
    case 'bow': {
      const r = COMBAT.RANGE_BOW_MIN + (c.stats.dexterity / STAT.MAX) * (COMBAT.RANGE_BOW_MAX - COMBAT.RANGE_BOW_MIN);
      return r * 32;
    }
    case 'magic': {
      const r = COMBAT.RANGE_MAGIC_MIN + (c.stats.magic / STAT.MAX) * (COMBAT.RANGE_MAGIC_MAX - COMBAT.RANGE_MAGIC_MIN);
      return r * 32;
    }
  }
}

function pushHistory(c: Character, state: GameState, text: string): void {
  c.history.push({ stamp: `${formatGameTime(state.tick)}に`, text });
}

function usesMagic(c: Character): boolean {
  return c.stats.magic > c.stats.power && c.stats.mp >= COMBAT.MP_COST_ATTACK && c.skills.spells.length > 0;
}

function shoutAttack(state: GameState, attacker: Character, spellOrSpecial: string): void {
  const tough = attacker.personality.aggression > 0.6;
  const text = tough ? `覚悟せよ、${spellOrSpecial}！` : `…${spellOrSpecial}！`;
  state.addTalk(attacker.id, attacker.targetId, text);
}

function computeDamage(rng: Rng, attacker: Character, defender: Character, magic: boolean): number {
  const atk = magic ? attacker.stats.magic : attacker.stats.power;
  const mastery = magic
    ? attacker.skills.magic.attack
    : attacker.skills.weaponMastery[attacker.inventory.weapon];
  const raw = atk * (1 + mastery / STAT.MAX) * rng.range(0.8, 1.2);
  const evade = defender.stats.reaction / (STAT.MAX * 2);
  if (rng.chance(evade)) return 0;
  const mitigation = 1 - defender.stats.reaction / (STAT.MAX * 4);
  return Math.max(1, Math.round(raw * mitigation));
}

export function inAttackRange(attacker: Character, defender: Character): boolean {
  const range = weaponRange(attacker.inventory.weapon, attacker);
  return dist(attacker.x, attacker.y, defender.x, defender.y) <= range + 16;
}

export function performAttack(rng: Rng, state: GameState, attacker: Character, defender: Character): void {
  if (attacker.attackCooldown > 0) return;
  attacker.attackCooldown = COMBAT.ATTACK_COOLDOWN_TICKS;
  attacker.idleTicks = 0;

  const magic = usesMagic(attacker);
  if (magic) {
    attacker.stats.mp = Math.max(0, attacker.stats.mp - COMBAT.MP_COST_ATTACK);
    const spell = attacker.skills.spells[0];
    shoutAttack(state, attacker, spell);
    state.addEffect(defender.x, defender.y, 'magic', 0, 14);
  } else if (attacker.skills.specials.length > 0 && rng.chance(0.2)) {
    shoutAttack(state, attacker, attacker.skills.specials[0]);
  }

  const hits = 1 + Math.floor(attacker.stats.agility / STAT.MAX * 2);
  let total = 0;
  for (let i = 0; i < hits; i++) {
    total += computeDamage(rng, attacker, defender, magic);
  }
  defender.stats.hp = clamp(defender.stats.hp - total, 0, defender.stats.hpMax);
  state.addEffect(defender.x, defender.y, 'damage', total, 14);

  const cur = defender.relations.get(attacker.id) ?? 0;
  defender.relations.set(attacker.id, clamp(cur - 12, RELATION.MIN, RELATION.MAX));

  if (defender.stats.hp <= 0) {
    resolveDefeat(rng, state, attacker, defender);
  }
}

function resolveDefeat(rng: Rng, state: GameState, attacker: Character, defender: Character): void {
  const grudge = (defender.relations.get(attacker.id) ?? 0) <= RELATION.HATE;
  const moral = attacker.stats.moral;
  const evil = moral <= MORAL.KILL_THRESHOLD;
  const high = moral >= MORAL.SPARE_THRESHOLD;

  state.addTalk(defender.id, attacker.id, deathWords(defender));

  if (defender.kind === 'monster' || defender.kind === 'boss') {
    killAndMaybeEat(rng, state, attacker, defender, true);
    return;
  }

  if (evil || grudge) {
    killAndMaybeEat(rng, state, attacker, defender, attacker.kind !== 'npc');
    return;
  }

  if (high) {
    if (rng.chance(0.6)) {
      spare(state, attacker, defender);
    } else {
      recruit(state, attacker, defender);
    }
    return;
  }

  const roll = rng.next();
  if (roll < 0.3) rob(state, attacker, defender);
  else if (roll < 0.5) abduct(state, attacker, defender);
  else if (roll < 0.7) recruit(state, attacker, defender);
  else spare(state, attacker, defender);
}

function gainExperience(attacker: Character, defender: Character): void {
  let sum = 0;
  const keys: (keyof Stats)[] = ['power', 'magic', 'agility', 'reaction', 'perception', 'dexterity'];
  for (const k of keys) sum += defender.stats[k];
  attacker.experience += normalize10(sum / keys.length, 10);
}

function killAndMaybeEat(rng: Rng, state: GameState, attacker: Character, defender: Character, canEat: boolean): void {
  defender.alive = false;
  defender.deadTicks = DEAD.GRAYSCALE_TICKS;
  gainExperience(attacker, defender);
  state.addEvent(`${displayName(attacker)} が ${displayName(defender)} を討伐`, COLOR_DEATH, [attacker.id, defender.id]);
  pushHistory(attacker, state, `${displayName(defender)}を討伐`);

  if (canEat && rng.chance(0.5)) {
    eat(state, attacker, defender);
  }
}

export function eat(state: GameState, eater: Character, prey: Character): void {
  const keys: (keyof Stats)[] = ['power', 'magic', 'agility', 'reaction', 'perception', 'dexterity'];
  for (const k of keys) {
    const gain = normalize10(prey.stats[k], STAT.CAPTURE_DIVISOR);
    eater.stats[k] = clamp(eater.stats[k] + gain, STAT.MIN, STAT.MAX);
  }
  eater.title = computeTitle(eater.kind, eater.stats, eater.personality);
  prey.deadTicks = 0;
  prey.alive = false;
  state.addEvent(`${displayName(eater)} が ${displayName(prey)} を捕食`, COLOR_DEATH, [eater.id, prey.id]);
  pushHistory(eater, state, `${displayName(prey)}を捕食`);
}

function rob(state: GameState, attacker: Character, defender: Character): void {
  attacker.inventory.money += defender.inventory.money;
  defender.inventory.money = 0;
  defender.stats.hp = 1;
  state.addEvent(`${displayName(attacker)} が ${displayName(defender)} から強奪`, 0xffff55, [attacker.id, defender.id]);
}

function abduct(state: GameState, attacker: Character, defender: Character): void {
  defender.captive.capturedBy = attacker.id;
  defender.captive.followingLeader = attacker.id;
  defender.captive.imprisoned = false;
  defender.stats.hp = 1;
  state.addEvent(`${displayName(attacker)} が ${displayName(defender)} を拉致`, COLOR_RELATION, [attacker.id, defender.id]);
  pushHistory(defender, state, `${displayName(attacker)}に拉致された`);
}

function recruit(state: GameState, attacker: Character, defender: Character): void {
  defender.captive.followingLeader = attacker.id;
  defender.stats.hp = Math.round(defender.stats.hpMax * 0.5);
  state.addEvent(`${displayName(defender)} が ${displayName(attacker)} の配下に`, COLOR_RELATION, [attacker.id, defender.id]);
  pushHistory(defender, state, `${displayName(attacker)}の配下になった`);
}

function spare(state: GameState, attacker: Character, defender: Character): void {
  defender.stats.hp = Math.round(defender.stats.hpMax * 0.3);
  defender.fleeing = true;
  state.addEvent(`${displayName(attacker)} が ${displayName(defender)} を見逃した`, COLOR_RELATION, [attacker.id, defender.id]);
}

function deathWords(c: Character): string {
  if (c.kind === 'monster' || c.kind === 'boss') return 'グォォォ…！';
  return 'ここまでか…無念…';
}

export function displayName(c: Character): string {
  if (c.kind === 'monster') return `魔物(${c.lastName})`;
  if (c.kind === 'boss') return `魔王${c.lastName}`;
  return `(${c.title})${c.lastName}・${c.firstName}`;
}

export function monsterShout(state: GameState, m: Character): void {
  const cries = ['ギャアアア！', 'グルルル…', 'シャアアッ！', 'ゴガアアア！'];
  const idx = (state.tick + m.id) % cries.length;
  state.addTalk(m.id, m.targetId, cries[idx]);
}

export const COMBAT_COLORS = { COLOR_DEATH, COLOR_RELATION };