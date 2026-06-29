// 責務: ドメイン全体で共有する型・列挙・インタフェースの定義。

export type CharacterKind = 'npc' | 'monster' | 'boss';

export type Gender = 'male' | 'female';

export type WeaponType = 'sword' | 'polearm' | 'bow' | 'none';

export type Faction = 'civil' | 'bandit' | 'wild';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Attributes {
  build: number; // 体格
  agility: number; // 瞬発力
  reaction: number; // 反応
  perception: number; // 知覚
  dexterity: number; // 巧緻性
  magicPower: number; // 魔法力
}

export interface Skills {
  sword: number;
  polearm: number;
  bow: number;
  magicAttack: number;
  magicBuff: number;
  magicDebuff: number;
  cartography: number; // 地図把握度
}

export interface Inventory {
  weapon: WeaponType;
  food: number;
  treasures: number; // 値打ちものの個数
  gold: number;
}

export interface Desires {
  basic: number; // 三大欲求
  money: number; // 金銭欲
  honor: number; // 名誉欲
  growth: number; // 成長意欲
  skill: number; // スキル習得欲
}

export interface HistoryEntry {
  /** 既にprefix("Y年m月d日 H時に")を含んだ完成文 */
  text: string;
}

export type LogColorKey =
  | 'death'
  | 'relation'
  | 'treasure'
  | 'money'
  | 'normal';