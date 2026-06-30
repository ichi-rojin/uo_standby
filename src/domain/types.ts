// 責務: ゲーム内ドメインの型定義集約
export type Vec2 = { x: number; y: number };

export type Gender = 'male' | 'female';

export type WeaponType = 'sword' | 'pole' | 'bow' | 'magic';

export type CharacterKind = 'npc' | 'monster' | 'boss';

export type EntityKind = CharacterKind | 'city' | 'supply' | 'fort';

export interface Abilities {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  health: number;
  power: number;
  agility: number;
  reaction: number;
  perception: number;
  dexterity: number;
  magic: number;
  honor: number;
  moral: number;
}

export interface Skills {
  swordSkill: number;
  poleSkill: number;
  bowSkill: number;
  magicAttack: number;
  magicHeal: number;
  magicBuff: number;
  magicDebuff: number;
  mapKnowledge: number;
  special: number;
}

export interface Needs {
  hunger: number;
  sleep: number;
  lust: number;
  greed: number;
  honorWant: number;
  growth: number;
  skillWant: number;
}

export interface Inventory {
  weapon: WeaponType;
  food: number;
  valuables: number;
  money: number;
}

export type GoalType =
  | 'idle'
  | 'hunt'
  | 'goCity'
  | 'rest'
  | 'mate'
  | 'banditRaid'
  | 'wander';

export interface HistoryEntry {
  tick: number;
  text: string;
}

export type LogCategory = 'death' | 'relation' | 'treasure' | 'money' | 'default';

export interface RelationMap {
  [otherId: number]: number;
}