// src/entities/Character.ts
// 責務: キャラクター（NPC/モンスター/ボス）の生成ファクトリと能力値導出を担う。

import { nextEntityId } from '../domain/ids';
import type { EntityId } from '../domain/ids';
import { CharacterKind, Personality, WeaponType, LifeState, AgentGoal } from '../domain/enums';
import type { CharacterData, Vec2, Attributes, Skills, Inventory, Desires } from '../domain/types';
import { STATS } from '../config/constants';
import { Rng } from '../util/rng';

const FAMILY_NAMES: readonly string[] = [
  'アルド', 'ベルク', 'カイン', 'ドレイ', 'エルム', 'ファル', 'ガロ', 'ハイン',
  'イーリ', 'ジェイク', 'カルロ', 'ロウン', 'マグナ', 'ノルド', 'オルガ', 'パイン',
];

const GIVEN_NAMES: readonly string[] = [
  'アキ', 'ベル', 'シオン', 'ダン', 'エナ', 'フィー', 'グレン', 'ハル',
  'イヴ', 'ジン', 'カイ', 'レン', 'ミオ', 'ノア', 'オウ', 'ピア',
];

const MONSTER_NAMES: readonly string[] = [
  'ゴブ', 'スラ', 'オーガ', 'ワイト', 'コボル', 'ハーピ', 'ウルフ', 'バット',
];

const PERSONALITIES: readonly Personality[] = [
  Personality.Brave,
  Personality.Coward,
  Personality.Greedy,
  Personality.Honorable,
  Personality.Wanderer,
  Personality.Homebound,
  Personality.Cruel,
  Personality.Kind,
];

const WEAPONS: readonly WeaponType[] = [WeaponType.Sword, WeaponType.Polearm, WeaponType.Bow];

function rollAttributes(rng: Rng, kind: CharacterKind): Attributes {
  const bossMul = kind === CharacterKind.Boss ? 2.2 : 1.0;
  const hp = Math.round(STATS.BASE_HP * bossMul * rng.range(0.8, 1.3));
  const mp = Math.round(STATS.BASE_MP * bossMul * rng.range(0.7, 1.4));
  return {
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    health: STATS.BASE_HEALTH,
    build: Math.round(rng.range(10, 30) * bossMul),
    agility: Math.round(rng.range(10, 30) * bossMul),
    reaction: Math.round(rng.range(10, 30) * bossMul),
    perception: Math.round(rng.range(10, 30) * bossMul),
    dexterity: Math.round(rng.range(10, 30) * bossMul),
    magic: Math.round(rng.range(5, 30) * bossMul),
  };
}

function rollSkills(rng: Rng): Skills {
  return {
    sword: rng.int(0, 60),
    polearm: rng.int(0, 60),
    bow: rng.int(0, 60),
    magicAttack: rng.int(0, 50),
    magicBuff: rng.int(0, 50),
    magicDebuff: rng.int(0, 50),
    mapKnowledge: rng.int(0, 80),
  };
}

function rollInventory(rng: Rng): Inventory {
  return {
    weapon: rng.pick(WEAPONS),
    food: rng.int(3, 12),
    valuables: 0,
    gold: rng.int(0, 50),
  };
}

function rollDesires(rng: Rng): Desires {
  return {
    basic: rng.range(0, 1),
    money: rng.range(0, 1),
    honor: rng.range(0, 1),
    growth: rng.range(0, 1),
    skillLearning: rng.range(0, 1),
  };
}

function buildEpithet(personality: Personality): string {
  switch (personality) {
    case Personality.Brave:
      return '勇敢なる';
    case Personality.Coward:
      return '臆病な';
    case Personality.Greedy:
      return '強欲な';
    case Personality.Honorable:
      return '誇り高き';
    case Personality.Wanderer:
      return '放浪の';
    case Personality.Homebound:
      return '定住の';
    case Personality.Cruel:
      return '残忍な';
    case Personality.Kind:
      return '心優しき';
    default:
      return '名もなき';
  }
}

export interface CreateCharacterParams {
  kind: CharacterKind;
  position: Vec2;
  rng: Rng;
  tint: number;
  homeCityId: EntityId | null;
}

export function createCharacter(params: CreateCharacterParams): CharacterData {
  const { kind, position, rng, tint, homeCityId } = params;
  const personality = rng.pick(PERSONALITIES);
  const attr = rollAttributes(rng, kind);
  const isNpc = kind === CharacterKind.NPC;
  const familyName = isNpc ? rng.pick(FAMILY_NAMES) : rng.pick(MONSTER_NAMES);
  const givenName = isNpc ? rng.pick(GIVEN_NAMES) : rng.pick(MONSTER_NAMES);
  return {
    id: nextEntityId(),
    kind,
    familyName,
    givenName,
    epithet: buildEpithet(personality),
    personality,
    attr,
    skills: rollSkills(rng),
    inventory: rollInventory(rng),
    desires: rollDesires(rng),
    position: { x: position.x, y: position.y },
    velocity: { x: 0, y: 0 },
    goal: AgentGoal.Idle,
    goalTarget: null,
    state: LifeState.Alive,
    deadTimer: 0,
    idleTimer: 0,
    homeCityId,
    attachment: rng.range(0, 1),
    tint,
    animPhase: rng.range(0, Math.PI * 2),
    history: [],
  };
}

export function characterDisplayName(c: CharacterData): string {
  return `(${c.epithet})${c.familyName}・${c.givenName}`;
}