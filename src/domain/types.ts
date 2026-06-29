// src/domain/types.ts
// 責務: ゲームドメインの基本データ構造（座標・能力値・スキル・履歴・ログ）を定義する。

import type { EntityId } from './ids';
import type {
  CharacterKind,
  Personality,
  WeaponType,
  LifeState,
  EventCategory,
  EffectKind,
  AgentGoal,
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
  build: number; // 体格
  agility: number; // 瞬発力
  reaction: number; // 反応
  perception: number; // 知覚
  dexterity: number; // 巧緻性
  magic: number; // 魔法力
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
  valuables: number; // 値打ちもの個数
  gold: number;
}

export interface Desires {
  basic: number; // 三大欲求
  money: number; // 金銭欲
  honor: number; // 名誉欲
  growth: number; // 成長意欲
  skillLearning: number; // スキル習得欲
}

export interface HistoryEntry {
  date: GameDate;
  text: string;
}

export interface CharacterData {
  id: EntityId;
  kind: CharacterKind;
  familyName: string;
  givenName: string;
  epithet: string; // 通り名
  personality: Personality;
  attr: Attributes;
  skills: Skills;
  inventory: Inventory;
  desires: Desires;
  position: Vec2;
  velocity: Vec2;
  goal: AgentGoal;
  goalTarget: Vec2 | null;
  state: LifeState;
  deadTimer: number; // 死亡後グレースケール残り秒
  idleTimer: number; // 無行動禁止カウンタ
  homeCityId: EntityId | null;
  attachment: number; // 都市帰属度 0..1
  tint: number; // 個体色
  animPhase: number; // アニメ位相
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
}

export interface SupplyPostData {
  id: EntityId;
  name: string;
  position: Vec2;
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