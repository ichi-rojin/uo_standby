// File: src/config/GameConfig.ts
// 責務: ゲーム全体の定数定義。マジックナンバーを排除し全パラメータを一元管理する。

export const WorldConfig = {
  WIDTH: 8000,
  HEIGHT: 8000,
  EDGE_MARGIN: 400,
  CELL_SIZE: 256,
} as const;

export const PopulationConfig = {
  NPC_COUNT: 100,
  CITY_COUNT: 60,
  SUPPLY_COUNT: 200,
  MONSTER_MIN: 100,
  MONSTER_MAX: 500,
} as const;

export const TimeConfig = {
  START_YEAR: 1,
  START_MONTH: 1,
  START_DAY: 1,
  START_HOUR: 6,
  REAL_MS_PER_GAME_HOUR: 2000,
  SPEED_PAUSE: 0,
  SPEED_NORMAL: 1,
  SPEED_FAST: 2,
  HOURS_PER_DAY: 24,
  DAYS_PER_MONTH: 30,
  MONTHS_PER_YEAR: 12,
} as const;

export const StatsConfig = {
  HP_MIN: 30,
  HP_MAX: 120,
  MP_MIN: 10,
  MP_MAX: 80,
  HEALTH_MAX: 100,
  HEALTH_DEBUFF_THRESHOLD: 60,
  ATTR_MIN: 5,
  ATTR_MAX: 30,
  SKILL_MIN: 0,
  SKILL_MAX: 100,
} as const;

export const RecoveryConfig = {
  CITY_HP_PER_HOUR: 8,
  CITY_MP_PER_HOUR: 6,
  CITY_HEALTH_PER_HOUR: 5,
  STACK_HEAL_HP_PER_HOUR: 1,
  STACK_HEAL_MP_PER_HOUR: 1,
} as const;

export const MonsterConfig = {
  STRONG_THRESHOLD: 0.7,
  RESPAWN_BATCH: 20,
  WANDER_RADIUS_MIN: 200,
  WANDER_RADIUS_MAX: 1200,
} as const;

export const CameraConfig = {
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 3.0,
  ZOOM_STEP: 1.1,
  MOVE_SPEED: 800,
  START_ZOOM: 0.25,
} as const;

export const RenderConfig = {
  CHAR_RADIUS: 10,
  CITY_RADIUS: 28,
  SUPPLY_RADIUS: 14,
  ROAD_WIDTH: 4,
  BAR_WIDTH: 22,
  BAR_HEIGHT: 3,
  DEATH_GRAYSCALE_HOURS: 24,
  ANIM_BOB_SPEED: 6,
  ANIM_BOB_AMPLITUDE: 2,
} as const;

export const ColorConfig = {
  BACKGROUND: 0x101015,
  GRASS: 0x1f2e1f,
  ROAD: 0x55555f,
  CITY_FILL: 0xd0b070,
  CITY_BORDER: 0x8a6a30,
  SUPPLY_FILL: 0x8090b0,
  SUPPLY_BORDER: 0x506080,
  NPC_GOOD: 0x4a90d9,
  NPC_EVIL: 0xb04040,
  MONSTER_BASE_STRONG: 0x301030,
  MONSTER_BASE_WEAK: 0xc090d0,
  HP_BAR: 0x40d040,
  HP_BAR_BG: 0x303030,
  MP_BAR: 0x4060f0,
  TEXT: 0xe8e8e8,
  EFFECT_DAMAGE: 0xff4040,
  EFFECT_HEAL: 0x40ff80,
  EFFECT_BUFF: 0x40c0ff,
  EFFECT_DEBUFF: 0xc040ff,
} as const;

export const LogConfig = {
  MAX_EVENT_LOG: 200,
  MAX_CHAT_LOG: 40,
  COLOR_DEATH: '#ff5050',
  COLOR_RELATION: '#50ff70',
  COLOR_TREASURE: '#ffd040',
  COLOR_MONEY: '#ffff60',
  COLOR_NORMAL: '#e8e8e8',
} as const;

export const EffectConfig = {
  FLOAT_TEXT_DURATION: 1.2,
  FLOAT_TEXT_RISE: 30,
  RING_DURATION: 0.6,
  RING_MAX_RADIUS: 40,
} as const;