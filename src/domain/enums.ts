// src/domain/enums.ts
// 責務: ドメイン全体で使う列挙型を定義する（第2便で AI/感情/夜盗関連を追加）。

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
  Flee = 'FLEE',
  Rob = 'ROB',
  RecoverInCity = 'RECOVER_IN_CITY',
  Socialize = 'SOCIALIZE',
}

export enum ActionType {
  MoveTo = 'MOVE_TO',
  AttackTarget = 'ATTACK_TARGET',
  FleeFrom = 'FLEE_FROM',
  EnterCity = 'ENTER_CITY',
  RecoverInCity = 'RECOVER_IN_CITY',
  RobTarget = 'ROB_TARGET',
  Socialize = 'SOCIALIZE',
}

export enum RelationKind {
  Neutral = 'NEUTRAL',
  Friend = 'FRIEND',
  Hate = 'HATE',
  Rival = 'RIVAL',
  Love = 'LOVE',
}

export enum Allegiance {
  Citizen = 'CITIZEN',
  Bandit = 'BANDIT',
  Wild = 'WILD',
}