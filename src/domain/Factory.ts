// 責務: キャラクター(NPC/モンスター/ボス)生成ロジック
import { Rng } from '../core/Rng';
import type { Vec2 } from '../core/Vec2';
import { STATS, COLORS, HEREDITY } from '../config/constants';
import type { Character, EntityKind, Gender, WeaponKind } from './types';
import { genName } from './Names';
import { computeTitle } from './Titles';

const WEAPONS: readonly WeaponKind[] = ['sword', 'pole', 'bow', 'magic'];

function newNeeds() {
  return { hunger: 0, sleep: 0, lust: 0, money: 0, fame: 0, growth: 0, skill: 0 };
}

function newSkills(rng: Rng) {
  const r = () => rng.int(0, 50);
  return {
    weaponSword: r(),
    weaponPole: r(),
    weaponBow: r(),
    magicAttack: r(),
    magicHeal: r(),
    magicBuff: r(),
    magicDebuff: r(),
    mapKnowledge: r(),
    special: r()
  };
}

export function createNpc(
  rng: Rng,
  id: number,
  pos: Vec2,
  homeCityId: number,
  forceEvil = false
): Character {
  const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
  const name = genName(rng, gender);
  const moral = forceEvil ? rng.int(-10, -3) : rng.int(-10, 10);
  const evil = forceEvil || moral < -5;
  const power = rng.int(20, 90);
  const magic = rng.int(10, 90);
  const stats = {
    hp: STATS.BASE_HP,
    maxHp: STATS.BASE_HP + rng.int(0, 60),
    mp: STATS.BASE_MP,
    maxMp: STATS.BASE_MP + rng.int(0, 60),
    health: STATS.BASE_HEALTH,
    power,
    agility: rng.int(20, 90),
    reflex: rng.int(20, 90),
    perception: rng.int(30, 90),
    dexterity: rng.int(20, 90),
    magic,
    honor: rng.int(0, 80),
    moral
  };
  stats.hp = stats.maxHp;
  stats.mp = stats.maxMp;
  const weapon: WeaponKind = magic > power ? 'magic' : rng.pick(WEAPONS);
  const c: Character = {
    id,
    kind: 'npc',
    gender,
    surname: name.surname,
    givenName: name.givenName,
    title: '',
    pos: { x: pos.x, y: pos.y },
    vel: { x: 0, y: 0 },
    stats,
    skills: newSkills(rng),
    needs: newNeeds(),
    inventory: { weapon, food: rng.int(3, 10), treasures: 0, gold: rng.int(10, 200) },
    relations: [],
    history: [],
    alive: true,
    deadSince: -1,
    evil,
    cityAttachment: rng.next(),
    homeCityId,
    state: 'idle',
    targetId: -1,
    goalPos: null,
    idleTime: 0,
    replanTimer: 0,
    attackCooldown: 0,
    monsterDarkness: 0,
    animPhase: rng.next() * Math.PI * 2,
    legendWeaponId: -1,
    parentIds: null,
    generation: 0
  };
  c.title = computeTitle(c);
  return c;
}

export function createMonster(rng: Rng, id: number, pos: Vec2, boss = false): Character {
  const darkness = boss ? 1 : rng.next();
  const scale = boss ? 3 : 0.6 + darkness;
  const maxHp = Math.floor((STATS.BASE_HP + rng.int(0, 80)) * scale);
  const stats = {
    hp: maxHp,
    maxHp,
    mp: STATS.BASE_MP,
    maxMp: STATS.BASE_MP,
    health: STATS.BASE_HEALTH,
    power: Math.floor(rng.int(20, 80) * scale),
    agility: rng.int(20, 90),
    reflex: rng.int(10, 70),
    perception: rng.int(40, 100),
    dexterity: rng.int(10, 60),
    magic: Math.floor(rng.int(10, 60) * scale),
    honor: 0,
    moral: -10
  };
  const c: Character = {
    id,
    kind: boss ? 'boss' : 'monster',
    gender: rng.chance(0.5) ? 'male' : 'female',
    surname: boss ? '魔界' : '野',
    givenName: boss ? '覇王' : 'の獣',
    title: '',
    pos: { x: pos.x, y: pos.y },
    vel: { x: 0, y: 0 },
    stats,
    skills: newSkills(rng),
    needs: newNeeds(),
    inventory: { weapon: 'sword', food: 0, treasures: boss ? 5 : 0, gold: 0 },
    relations: [],
    history: [],
    alive: true,
    deadSince: -1,
    evil: true,
    cityAttachment: 0,
    homeCityId: -1,
    state: 'wander',
    targetId: -1,
    goalPos: null,
    idleTime: 0,
    replanTimer: 0,
    attackCooldown: 0,
    monsterDarkness: darkness,
    animPhase: rng.next() * Math.PI * 2,
    legendWeaponId: -1,
    parentIds: null,
    generation: 0
  };
  c.title = computeTitle(c);
  return c;
}

export function monsterColor(darkness: number): number {
  const base = COLORS.MONSTER;
  const r = (base >> 16) & 0xff;
  const g = (base >> 8) & 0xff;
  const b = base & 0xff;
  const f = 1 - darkness * 0.6;
  const rr = Math.floor(r * f);
  const gg = Math.floor(g * f);
  const bb = Math.floor(b * f);
  return (rr << 16) | (gg << 8) | bb;
}

// 責務: 両親の能力を継承した子NPCを生成
export function createChildNpc(
  rng: Rng,
  id: number,
  pos: Vec2,
  homeCityId: number,
  parentA: Character,
  parentB: Character
): Character {
  const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
  const name = genName(rng, gender);
  const blendMoral = Math.round(
    (parentA.stats.moral + parentB.stats.moral) * HEREDITY.MORAL_BLEND
  );
  const inherit = (a: number, b: number): number => {
    const base = (a + b) / 2;
    const v = base * (1 + rng.range(-HEREDITY.STAT_VARIANCE, HEREDITY.STAT_VARIANCE));
    return Math.max(5, Math.round(v));
  };
  const power = inherit(parentA.stats.power, parentB.stats.power);
  const magic = inherit(parentA.stats.magic, parentB.stats.magic);
  const maxHp = STATS.BASE_HP + inherit(parentA.stats.maxHp - STATS.BASE_HP, parentB.stats.maxHp - STATS.BASE_HP);
  const maxMp = STATS.BASE_MP + inherit(parentA.stats.maxMp - STATS.BASE_MP, parentB.stats.maxMp - STATS.BASE_MP);
  const stats = {
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    health: STATS.BASE_HEALTH,
    power,
    agility: inherit(parentA.stats.agility, parentB.stats.agility),
    reflex: inherit(parentA.stats.reflex, parentB.stats.reflex),
    perception: inherit(parentA.stats.perception, parentB.stats.perception),
    dexterity: inherit(parentA.stats.dexterity, parentB.stats.dexterity),
    magic,
    honor: inherit(parentA.stats.honor, parentB.stats.honor),
    moral: Math.max(-10, Math.min(10, blendMoral))
  };
  const evil = stats.moral < -5;
  const inheritWeapon = rng.chance(HEREDITY.WEAPON_INHERIT_CHANCE);
  const weapon: WeaponKind = inheritWeapon
    ? (rng.chance(0.5) ? parentA.inventory.weapon : parentB.inventory.weapon)
    : (magic > power ? 'magic' : rng.pick(WEAPONS));
  const c: Character = {
    id,
    kind: 'npc',
    gender,
    surname: rng.chance(0.5) ? parentA.surname : parentB.surname,
    givenName: name.givenName,
    title: '',
    pos: { x: pos.x, y: pos.y },
    vel: { x: 0, y: 0 },
    stats,
    skills: newSkills(rng),
    needs: newNeeds(),
    inventory: { weapon, food: rng.int(3, 10), treasures: 0, gold: rng.int(10, 100) },
    relations: [],
    history: [],
    alive: true,
    deadSince: -1,
    evil,
    cityAttachment: (parentA.cityAttachment + parentB.cityAttachment) / 2,
    homeCityId,
    state: 'idle',
    targetId: -1,
    goalPos: null,
    idleTime: 0,
    replanTimer: 0,
    attackCooldown: 0,
    monsterDarkness: 0,
    animPhase: rng.next() * Math.PI * 2,
    legendWeaponId: -1,
    parentIds: [parentA.id, parentB.id],
    generation: Math.max(parentA.generation, parentB.generation) + 1
  };
  c.title = computeTitle(c);
  return c;
}
