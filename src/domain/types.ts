// src/domain/types.ts
// 責務: ゲームドメインの基本データ構造を定義する（第2便で AI/感情/夜盗/交配/砦を追加）。

import type { EntityId } from './ids';
import type {
  CharacterKind,
  Personality,
  WeaponType,
  LifeState,
  EventCategory,
  EffectKind,
  AgentGoal,
  ActionType,
  Allegiance,
} from './enums';

export interface Vec2 {
  x: number;
  y: number;
}

export interface GameDate {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export interface Attributes {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  health: number;
  build: number;
  agility: number;
  reaction: number;
  perception: number;
  dexterity: number;
  magic: number;
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
  gold: number;
}

export interface Desires {
  basic: number;
  money: number;
  honor: number;
  growth: number;
  skillLearning: number;
}

export interface HistoryEntry {
  date: GameDate;
  text: string;
}

export interface PlanStep {
  action: ActionType;
  targetId: EntityId | null;
  targetPos: Vec2 | null;
}

export interface CharacterData {
  id: EntityId;
  kind: CharacterKind;
  familyName: string;
  givenName: string;
  epithet: string;
  personality: Personality;
  allegiance: Allegiance;
  attr: Attributes;
  skills: Skills;
  inventory: Inventory;
  desires: Desires;
  position: Vec2;
  velocity: Vec2;
  goal: AgentGoal;
  goalTarget: Vec2 | null;
  plan: PlanStep[];
  planTimer: number;
  attackCooldown: number;
  combatTargetId: EntityId | null;
  state: LifeState;
  deadTimer: number;
  idleTimer: number;
  homeCityId: EntityId | null;
  fortId: EntityId | null;
  attachment: number;
  tint: number;
  animPhase: number;
  breedingCooldownDays: number;
  history: HistoryEntry[];
}

export interface QuestData {
  id: EntityId;
  title: string;
  reward: number;
}

export interface CityData {
  id: EntityId;
  name: string;
  position: Vec2;
  population: number;
  residentIds: Set<EntityId>;
  quests: QuestData[];
  events: HistoryEntry[];
  pendingChildren: PendingChild[];
}

export interface PendingChild {
  parentAId: EntityId;
  parentBId: EntityId;
  birth: GameDate;
  matureYear: number;
  tint: number;
}

export interface SupplyPostData {
  id: EntityId;
  name: string;
  position: Vec2;
}

export interface FortData {
  id: EntityId;
  position: Vec2;
  banditIds: Set<EntityId>;
}

export interface RoadSegment {
  from: Vec2;
  to: Vec2;
}

export interface EffectInstance {
  id: EntityId;
  kind: EffectKind;
  position: Vec2;
  age: number;
  duration: number;
  text: string;
  color: number;
}

export interface EventLogEntry {
  id: EntityId;
  date: GameDate;
  category: EventCategory;
  message: string;
  relatedCharacterIds: EntityId[];
}

export interface ChatLogEntry {
  id: EntityId;
  date: GameDate;
  speakerId: EntityId;
  speakerName: string;
  message: string;
}