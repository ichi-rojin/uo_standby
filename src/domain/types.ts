// 責務: ゲームドメインの型定義（エンティティ・能力値・列挙）
export type EntityId = number;

export type Sex = 'male' | 'female';

export type WeaponKind = 'sword' | 'pole' | 'bow' | 'magic';

export type MagicKind = 'attack' | 'heal' | 'buff' | 'debuff';

export type CharacterKind = 'npc' | 'bandit' | 'monster' | 'boss';

export type Personality = {
  aggression: number;
  courage: number;
  greed: number;
  lust: number;
  sociability: number;
  ambition: number;
  wanderlust: number;
};

export type Stats = {
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  health: number;
  power: number;
  agility: number;
  reaction: number;
  perception: number;
  dexterity: number;
  magic: number;
  honor: number;
  moral: number;
};

export type Needs = {
  food: number;
  sleep: number;
  libido: number;
};

export type Skills = {
  weaponMastery: Record<WeaponKind, number>;
  magic: Record<MagicKind, number>;
  mapKnowledge: number;
  specials: string[];
  spells: string[];
};

export type Inventory = {
  weapon: WeaponKind;
  food: number;
  treasures: number;
  money: number;
};

export type Buff = {
  stat: keyof Stats;
  amount: number;
  ttl: number;
};

export type HistoryEntry = {
  stamp: string;
  text: string;
};

export type CaptiveState = {
  capturedBy: EntityId | null;
  followingLeader: EntityId | null;
  imprisoned: boolean;
};

export type Character = {
  id: EntityId;
  kind: CharacterKind;
  firstName: string;
  lastName: string;
  title: string;
  sex: Sex;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stats: Stats;
  needs: Needs;
  personality: Personality;
  skills: Skills;
  inventory: Inventory;
  buffs: Buff[];
  experience: number;
  alive: boolean;
  deadTicks: number;
  homeId: EntityId | null;
  fortId: EntityId | null;
  targetId: EntityId | null;
  goal: GoalType;
  attackCooldown: number;
  reproCooldown: number;
  idleTicks: number;
  relations: Map<EntityId, number>;
  history: HistoryEntry[];
  biomeIndex: number;
  fleeing: boolean;
  captive: CaptiveState;
  animPhase: number;
};

export type GoalType =
  | 'idle'
  | 'hunt'
  | 'eat'
  | 'sleep'
  | 'mate'
  | 'gainMoney'
  | 'restCity'
  | 'wander'
  | 'flee'
  | 'rob'
  | 'raid'
  | 'follow';

export type City = {
  id: EntityId;
  name: string;
  x: number;
  y: number;
  population: number;
  defense: number;
  residents: EntityId[];
  children: ChildRecord[];
  quests: Quest[];
  events: HistoryEntry[];
};

export type ChildRecord = {
  sex: Sex;
  lastName: string;
  maturityTick: number;
};

export type Village = {
  id: EntityId;
  name: string;
  x: number;
  y: number;
};

export type Fort = {
  id: EntityId;
  x: number;
  y: number;
  members: EntityId[];
  alive: boolean;
};

export type Boss = {
  id: EntityId;
  charId: EntityId;
  x: number;
  y: number;
};

export type Dungeon = {
  id: EntityId;
  x: number;
  y: number;
  cleared: boolean;
  legendaryWeapon: string;
  treasure: number;
};

export type QuestType = 'slayBoss' | 'slayBandit' | 'dungeon' | 'escort' | 'delivery' | 'assassinate';

export type Quest = {
  id: EntityId;
  type: QuestType;
  cityId: EntityId;
  targetId: EntityId | null;
  reward: number;
  acceptedBy: EntityId | null;
  done: boolean;
  description: string;
};

export type Road = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
};

export type EventLogEntry = {
  text: string;
  color: number;
  refs: EntityId[];
};

export type TalkLogEntry = {
  id: number;
  from: EntityId;
  to: EntityId | null;
  text: string;
};

export type EffectKind = 'damage' | 'heal' | 'buff' | 'debuff' | 'magic';

export type Effect = {
  x: number;
  y: number;
  kind: EffectKind;
  ttl: number;
  value: number;
};