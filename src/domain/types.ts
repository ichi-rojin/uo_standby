// File: src/domain/types.ts
// 責務: ゲーム全体で共有するドメイン型・列挙の定義。

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum WeaponType {
  Sword = 'sword',
  Polearm = 'polearm',
  Bow = 'bow',
}

export enum EntityKind {
  Npc = 'npc',
  Monster = 'monster',
  Boss = 'boss',
}

export enum CharacterState {
  Idle = 'idle',
  Moving = 'moving',
  Fighting = 'fighting',
  Dead = 'dead',
  Resting = 'resting',
}

export interface Attributes {
  physique: number;
  agility: number;
  reaction: number;
  perception: number;
  dexterity: number;
  magicPower: number;
}

export interface Skills {
  sword: number;
  polearm: number;
  bow: number;
  magicAttack: number;
  magicBuff: number;
  magicDebuff: number;
  mapKnowledge: number;
}

export interface Inventory {
  weapon: WeaponType;
  food: number;
  valuables: number;
  money: number;
}

export interface Desires {
  primal: number;
  money: number;
  honor: number;
  growth: number;
  skill: number;
}

export enum HistoryKind {
  Defeat = 'defeat',
  Mate = 'mate',
  Party = 'party',
  Devour = 'devour',
  Acquire = 'acquire',
  AttrUp = 'attrUp',
  SkillUp = 'skillUp',
}

export interface HistoryEntry {
  stamp: string;
  text: string;
}

export interface EffectColor {
  damage: number;
  heal: number;
  buff: number;
  debuff: number;
}