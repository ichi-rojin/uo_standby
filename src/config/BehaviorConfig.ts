// File: src/config/BehaviorConfig.ts
// 責務: AI・戦闘・感情・夜盗・交配の挙動パラメータ定数。マジックナンバーを排除する。

export const CombatConfig = {
  ATTACK_RANGE: 40,
  PERCEPTION_RANGE: 350,
  ATTACK_COOLDOWN_HOURS: 1,
  BASE_DAMAGE: 6,
  DAMAGE_SKILL_SCALE: 0.15,
  DAMAGE_PHYSIQUE_SCALE: 0.4,
  MAGIC_MP_COST: 8,
  HEALTH_HIT_ON_DAMAGE: 1.5,
  FOOD_GAIN_ON_KILL: 4,
  MONEY_GAIN_ON_KILL: 12,
  VALUABLE_DROP_CHANCE: 0.2,
} as const;

export const RelationConfig = {
  FRIEND_THRESHOLD: 40,
  RIVAL_THRESHOLD: 25,
  HATE_THRESHOLD: -40,
  LOVE_THRESHOLD: 60,
  PROXIMITY_BOND_RANGE: 120,
  BOND_PER_TICK: 1,
  HATE_ON_ATTACK: 15,
  LOVE_GROWTH_PER_TICK: 2,
  MAX_RELATION: 100,
  MIN_RELATION: -100,
} as const;

export const BanditConfig = {
  EVIL_MONEY_THRESHOLD: 5,
  FORT_BUILD_CHANCE: 0.02,
  RECRUIT_RANGE: 200,
  RECRUIT_POWER_RATIO: 0.7,
  ROB_RANGE: 60,
  ROB_AMOUNT: 20,
  FORT_DECAY_CHECK: true,
} as const;

export const MatingConfig = {
  MATE_RANGE: 80,
  MATE_LOVE_REQUIRED: 60,
  MATE_COOLDOWN_HOURS: 240,
  CHILD_MATURE_YEARS: 10,
  MATE_HEALTH_REQUIRED: 50,
} as const;

export const DesireConfig = {
  HUNGER_FOOD_THRESHOLD: 2,
  CITY_SEEK_RANGE: 4000,
  GROWTH_SKILL_GAIN: 2,
} as const;

export const ActionCost = {
  HUNT: 4,
  TRADE: 3,
  REST: 2,
  SOCIALIZE: 2,
  WANDER: 5,
  ROB: 3,
} as const;