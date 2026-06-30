// 責務: 第2便(交配/砦/ダンジョン/感情/伝説武器)の定数集約
export const REPRO = {
  LUST_THRESHOLD: 80,
  COOLDOWN_TICKS: 480,
  MATURE_TICKS: 480 * 12 * 30 * 10,
  CHILD_CHANCE: 0.5,
  MATE_RANGE: 40
} as const;

export const FORT = {
  RADIUS: 22,
  BUILD_GREED: 70,
  RECRUIT_RANGE: 120,
  HEAL_RATE: 4,
  COLOR: 0x553333,
  ROOF_COLOR: 0x331a1a
} as const;

export const DUNGEON = {
  COUNT: 8,
  RADIUS: 20,
  COLOR: 0x442255,
  BOSS_HP: 400,
  MONSTERS_PER: 6,
  TREASURE_VALUE: 500,
  ENTER_RANGE: 30,
  CLEAR_TICKS: 60
} as const;

export const EMOTION = {
  FRIEND: 30,
  LOVE: 60,
  RIVAL: -30,
  HATE: -60,
  ENCOUNTER_FRIEND_GAIN: 3,
  ENCOUNTER_RANGE: 60,
  ACCIDENT_PENALTY: -15
} as const;

export const LEGEND = {
  POWER_BONUS: 25,
  MAGIC_BONUS: 25,
  COLOR: 0xffcc33,
  NAMES: ['黎明剣エオス', '深淵の杖ノクス', '雷槍ガングニル', '聖弓アルテミス']
} as const;