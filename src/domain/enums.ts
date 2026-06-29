// src/domain/enums.ts
// 責務: ドメイン全体で使う列挙型を定義する。

export enum CharacterKind {
  NPC = 'NPC',
  Monster = 'MONSTER',
  Boss = 'BOSS',
}

export enum Personality {
  Brave = 'BRAVE',
  Coward = 'COWARD',
  Greedy = 'GREEDY',
  Honorable = 'HONORABLE',
  Wanderer = 'WANDERER',
  Homebound = 'HOMEBOUND',
  Cruel = 'CRUEL',
  Kind = 'KIND',
}

export enum WeaponType {
  Sword = 'SWORD',
  Polearm = 'POLEARM',
  Bow = 'BOW',
}

export enum LifeState {
  Alive = 'ALIVE',
  Dead = 'DEAD',
}

export enum EventCategory {
  Death = 'DEATH',
  Relation = 'RELATION',
  Treasure = 'TREASURE',
  Money = 'MONEY',
  Generic = 'GENERIC',
}

export enum EffectKind {
  DamageText = 'DAMAGE_TEXT',
  BuffRing = 'BUFF_RING',
  DebuffRing = 'DEBUFF_RING',
  HitFlash = 'HIT_FLASH',
}

export enum AgentGoal {
  Idle = 'IDLE',
  Wander = 'WANDER',
  TravelToCity = 'TRAVEL_TO_CITY',
  Hunt = 'HUNT',
}