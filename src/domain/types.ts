// 責務: ドメイン全体の型・列挙定義
import type { Vec2 } from '../core/Vec2';

export type Gender = 'male' | 'female';

export type WeaponKind = 'sword' | 'pole' | 'bow' | 'magic';

export type EntityKind = 'npc' | 'monster' | 'boss';

export interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  health: number;
  power: number;
  agility: number; // 瞬発力(攻撃回数)
  reflex: number; // 反応(回避)
  perception: number; // 知覚(発見射程)
  dexterity: number; // 巧緻性
  magic: number; // 魔法力
  honor: number; // 名誉
  moral: number; // モラル(-悪 +善)
}

export interface Skills {
  weaponSword: number;
  weaponPole: number;
  weaponBow: number;
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
  money: number;
  fame: number;
  growth: number;
  skill: number;
}

export interface Inventory {
  weapon: WeaponKind;
  food: number;
  treasures: number;
  gold: number;
}

export type RelationType = 'friend' | 'rival' | 'hatred' | 'love';

export interface Relation {
  targetId: number;
  type: RelationType;
  value: number;
}

export interface HistoryEntry {
  stamp: string;
  text: string;
}

export type AiState = 'idle' | 'seekFood' | 'seekCity' | 'hunt' | 'wander' | 'flee' | 'mate' | 'banditRaid';

export interface Character {
  id: number;
  kind: EntityKind;
  gender: Gender;
  surname: string;
  givenName: string;
  title: string;
  pos: Vec2;
  vel: Vec2;
  stats: Stats;
  skills: Skills;
  needs: Needs;
  inventory: Inventory;
  relations: Relation[];
  history: HistoryEntry[];
  alive: boolean;
  deadSince: number; // ゲーム時刻(分) -1=生存
  evil: boolean;
  cityAttachment: number; // 0=放浪 1=帰属
  homeCityId: number;
  state: AiState;
  targetId: number;
  goalPos: Vec2 | null;
  idleTime: number;
  replanTimer: number;
  attackCooldown: number;
  monsterDarkness: number; // モンスター色濃度0..1
  animPhase: number;
}

export interface City {
  id: number;
  name: string;
  pos: Vec2;
  population: number;
  storedChildren: { bornAt: number; gender: Gender }[];
  quests: Quest[];
  events: HistoryEntry[];
}

export interface Village {
  id: number;
  name: string;
  pos: Vec2;
}

export interface Road {
  a: Vec2;
  b: Vec2;
}

export interface Fort {
  id: number;
  pos: Vec2;
  members: number[];
  alive: boolean;
}

export type QuestKind = 'hunt' | 'escort' | 'delivery' | 'shopping' | 'assassinate';

export interface Quest {
  id: number;
  kind: QuestKind;
  text: string;
  acceptedBy: number;
  done: boolean;
}