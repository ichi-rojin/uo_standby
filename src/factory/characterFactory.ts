// 責務: キャラクター（NPC/盗賊/モンスター/ボス）の生成
import { Rng } from '../util/rng';
import { clamp } from '../util/math';
import { genFirstName, genLastName, spellsFor, specialsFor } from '../util/names';
import { COMBAT, STAT, NEED, HEALTH, MORAL } from '../config/constants';
import { biomeAt } from '../world/biome';
import type {
  Character,
  CharacterKind,
  EntityId,
  Personality,
  Sex,
  Skills,
  Stats,
  WeaponKind,
  MagicKind,
} from '../domain/types';

const WEAPONS: readonly WeaponKind[] = ['sword', 'pole', 'bow', 'magic'];
const MAGIC_KINDS: readonly MagicKind[] = ['attack', 'heal', 'buff', 'debuff'];

function rollStat(rng: Rng): number {
  return clamp(rng.int(20, 70), STAT.MIN, STAT.MAX);
}

function makePersonality(rng: Rng): Personality {
  return {
    aggression: rng.next(),
    courage: rng.next(),
    greed: rng.next(),
    lust: rng.next(),
    sociability: rng.next(),
    ambition: rng.next(),
    wanderlust: rng.next(),
  };
}

function makeSkills(rng: Rng, weapon: WeaponKind): Skills {
  const spells: string[] = [];
  for (const mk of MAGIC_KINDS) {
    if (rng.chance(0.4)) {
      const pool = spellsFor(mk);
      spells.push(rng.pick(pool));
    }
  }
  const specials: string[] = [];
  if (rng.chance(0.5)) specials.push(rng.pick(specialsFor(weapon)));
  return {
    weaponMastery: {
      sword: rng.int(0, 60),
      pole: rng.int(0, 60),
      bow: rng.int(0, 60),
      magic: rng.int(0, 60),
    },
    magic: {
      attack: rng.int(0, 60),
      heal: rng.int(0, 60),
      buff: rng.int(0, 40),
      debuff: rng.int(0, 40),
    },
    mapKnowledge: rng.int(0, 100),
    specials,
    spells,
  };
}

function moralFor(kind: CharacterKind, rng: Rng): number {
  if (kind === 'bandit') return rng.int(MORAL.MIN, MORAL.EVIL_THRESHOLD);
  if (kind === 'monster' || kind === 'boss') return rng.int(MORAL.MIN, -1);
  return rng.int(MORAL.MIN, MORAL.MAX);
}

function makeStats(rng: Rng, kind: CharacterKind): Stats {
  const scale = kind === 'boss' ? 2.4 : kind === 'monster' ? 1.1 : 1;
  const power = Math.round(rollStat(rng) * scale);
  const magic = Math.round(rollStat(rng) * scale);
  const hpMax = Math.round(COMBAT.BASE_HP * scale + power);
  const mpMax = Math.round(COMBAT.BASE_MP + magic);
  return {
    hp: hpMax,
    hpMax,
    mp: mpMax,
    mpMax,
    health: HEALTH.MAX,
    power,
    agility: rollStat(rng),
    reaction: rollStat(rng),
    perception: rollStat(rng),
    dexterity: rollStat(rng),
    magic,
    honor: kind === 'npc' ? rng.int(0, 50) : 0,
    moral: moralFor(kind, rng),
  };
}

function pickWeapon(rng: Rng, stats: Stats): WeaponKind {
  if (stats.magic > stats.power + 15) return 'magic';
  return rng.pick(WEAPONS);
}

let nextId = 1;

export function resetIdCounter(): void {
  nextId = 1;
}

export function allocId(): EntityId {
  return nextId++;
}

export function createCharacter(
  rng: Rng,
  kind: CharacterKind,
  x: number,
  y: number,
  sexOverride: Sex | null,
  homeId: EntityId | null,
): Character {
  const stats = makeStats(rng, kind);
  const sex: Sex = sexOverride ?? (rng.chance(0.5) ? 'male' : 'female');
  const weapon = pickWeapon(rng, stats);
  const skills = makeSkills(rng, weapon);
  const personality = makePersonality(rng);
  const lastName = genLastName(rng);
  const firstName = kind === 'monster' || kind === 'boss' ? '' : genFirstName(rng, sex);
  return {
    id: allocId(),
    kind,
    firstName,
    lastName,
    title: computeTitle(kind, stats, personality),
    sex,
    x,
    y,
    vx: 0,
    vy: 0,
    stats,
    needs: { food: NEED.MAX, sleep: NEED.MAX, libido: rng.range(0, NEED.MAX) },
    personality,
    skills,
    inventory: {
      weapon,
      food: rng.int(5, 30),
      treasures: 0,
      money: kind === 'npc' ? rng.int(10, 200) : rng.int(0, 50),
    },
    buffs: [],
    experience: 0,
    alive: true,
    deadTicks: 0,
    homeId,
    fortId: null,
    targetId: null,
    goal: 'idle',
    attackCooldown: 0,
    reproCooldown: 0,
    idleTicks: 0,
    relations: new Map<EntityId, number>(),
    history: [],
    biomeIndex: biomeAt(x, y),
    fleeing: false,
    captive: { capturedBy: null, followingLeader: null, imprisoned: false },
    animPhase: rng.range(0, Math.PI * 2),
  };
}

export function computeTitle(kind: CharacterKind, stats: Stats, p: Personality): string {
  if (kind === 'boss') return '魔王';
  if (kind === 'monster') return '魔物';
  if (kind === 'bandit') return '夜盗';
  if (stats.moral <= MORAL.EVIL_THRESHOLD) return '無頼漢';
  if (stats.power > 60 && p.courage > 0.6) return '剣豪';
  if (stats.magic > 60) return '賢者';
  if (stats.honor > 40) return '英雄';
  if (p.wanderlust > 0.7) return '放浪者';
  return '冒険者';
}