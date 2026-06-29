// src/config/constants.ts
// 責務: ゲーム全体で参照する数値定数・寸法・チューニング値を一元管理する（マジックナンバー排除）。

export const WORLD = {
  WIDTH: 8000,
  HEIGHT: 8000,
  EDGE_MARGIN: 400,
} as const;

export const COUNTS = {
  CITIES: 20,
  SUPPLY_POSTS: 100,
  NPCS: 100,
  MONSTER_MIN: 500,
  MONSTER_MAX: 1000,
} as const;

export const GRID = {
  CELL_SIZE: 256,
} as const;

export const CAMERA = {
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 3.0,
  DEFAULT_ZOOM: 0.18,
  ZOOM_STEP: 1.12,
  PAN_SPEED: 900,
} as const;

export const TIME = {
  // ゲーム内の1日 = 実時間秒数（標準速度時）
  REAL_SECONDS_PER_GAME_DAY: 24,
  START_YEAR: 1000,
  START_MONTH: 1,
  START_DAY: 1,
  START_HOUR: 6,
  DAYS_PER_MONTH: 30,
  MONTHS_PER_YEAR: 12,
  HOURS_PER_DAY: 24,
} as const;

export const SPEED = {
  PAUSED: 0,
  NORMAL: 1,
  FAST: 2,
} as const;

export const ENTITY_SIZE = {
  CITY_RADIUS: 90,
  SUPPLY_RADIUS: 40,
  CHARACTER_RADIUS: 22,
  MONSTER_RADIUS: 20,
} as const;

export const STATS = {
  BASE_HP: 100,
  BASE_MP: 60,
  BASE_HEALTH: 100,
  HEALTH_DEBUFF_THRESHOLD: 60,
} as const;

export const MOVEMENT = {
  NPC_BASE_SPEED: 60,
  MONSTER_BASE_SPEED: 45,
  ARRIVE_RADIUS: 30,
  IDLE_MAX_SECONDS: 6,
} as const;

export const DEATH = {
  GRAYSCALE_SECONDS: 12,
} as const;

export const EFFECT = {
  DAMAGE_TEXT_SECONDS: 1.2,
  BUFF_RING_SECONDS: 1.0,
  HIT_FLASH_SECONDS: 0.4,
} as const;

export const SPAWN = {
  MONSTER_RESPAWN_BATCH: 25,
  RESPAWN_INTERVAL_SECONDS: 1.5,
} as const;

export const LOG = {
  MAX_EVENT_ENTRIES: 200,
  MAX_CHAT_ENTRIES: 60,
} as const;

export const BARS = {
  WIDTH: 40,
  HEIGHT: 5,
  GAP: 2,
} as const;