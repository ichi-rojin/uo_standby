// 責務: ゲーム全体のマジックナンバーを集中管理する定数定義
export const WORLD = {
  WIDTH: 8000,
  HEIGHT: 8000,
  MARGIN: 200,
} as const;

export const COUNTS = {
  CITIES: 40,
  VILLAGES: 200,
  BIOMES: 10,
  NPC_MIN: 100,
  NPC_MAX: 255,
  MONSTER_MIN: 100,
  MONSTER_MAX: 500,
  BOSS: 8,
  DUNGEON: 12,
} as const;

export const GRID = {
  CELL_SIZE: 256,
} as const;

export const TIME = {
  TICK_MS: 100,
  GAME_SECONDS_PER_TICK: 3600,
  START_YEAR: 1000,
} as const;

export const SPEED = {
  PAUSE: 0,
  NORMAL: 1,
  FAST: 2,
} as const;

export const CAMERA = {
  MIN_ZOOM: 0.08,
  MAX_ZOOM: 4,
  ZOOM_STEP: 1.1,
  PAN_SPEED: 18,
} as const;

export const STAT = {
  MIN: 1,
  MAX: 100,
  CAPTURE_DIVISOR: 50,
  XP_NORM_MAX: 10,
} as const;

export const COMBAT = {
  RANGE_SWORD: 1,
  RANGE_POLE: 2,
  RANGE_BOW_MIN: 5,
  RANGE_BOW_MAX: 20,
  RANGE_MAGIC_MIN: 5,
  RANGE_MAGIC_MAX: 20,
  BASE_HP: 100,
  BASE_MP: 50,
  ATTACK_COOLDOWN_TICKS: 3,
  MP_COST_ATTACK: 8,
  MP_COST_HEAL: 6,
  MP_COST_BUFF: 5,
  HEAL_FACTOR: 1.5,
} as const;

export const NEED = {
  MAX: 100,
  DECAY_FOOD: 0.4,
  DECAY_SLEEP: 0.3,
  DECAY_LIBIDO: 0.2,
  HUNGER_HEALTH_PENALTY: 0.5,
  THRESHOLD_HIGH: 70,
  THRESHOLD_LOW: 30,
} as const;

export const HEALTH = {
  MAX: 100,
  DEBUFF_THRESHOLD: 60,
  FORAGE_DAMAGE: 0.8,
} as const;

export const RECOVER = {
  HP_PER_TICK: 4,
  MP_PER_TICK: 3,
  HEALTH_PER_TICK: 2,
} as const;

export const MORAL = {
  MIN: -10,
  MAX: 10,
  EVIL_THRESHOLD: -3,
  KILL_THRESHOLD: -2,
  SPARE_THRESHOLD: 4,
} as const;

export const RELATION = {
  MIN: -100,
  MAX: 100,
  FRIEND: 40,
  HATE: -40,
  LOVE: 70,
  RIVAL_LO: -10,
  RIVAL_HI: 10,
} as const;

export const FLEE = {
  HP_RATIO_BASE: 0.25,
} as const;

export const DEAD = {
  GRAYSCALE_TICKS: 240,
} as const;

export const REPRO = {
  LIBIDO_REQ: 60,
  CHILD_MATURE_TICKS_YEARS: 10,
  COOLDOWN_TICKS: 400,
} as const;

export const RENDER = {
  ICON_RADIUS: 14,
  BAR_WIDTH: 30,
  BAR_HEIGHT: 4,
  LABEL_OFFSET: 22,
  EFFECT_LIFETIME: 14,
  CITY_RADIUS: 26,
  VILLAGE_RADIUS: 12,
  BOSS_RADIUS: 30,
  DUNGEON_RADIUS: 18,
  CULL_PADDING: 100,
} as const;

export const LOG = {
  MAX_EVENT: 60,
  MAX_TALK: 14,
} as const;

export const AI = {
  PERCEPTION_BASE: 220,
  WANDER_RADIUS: 600,
  RAID_CHANCE: 0.0006,
  BANDIT_RECRUIT_RANGE: 300,
  ESCAPE_CHANCE_CAPTIVE: 0.008,
  NO_ACTION_LIMIT_TICKS: 30,
} as const;

export const FORT = {
  DECAY_CHECK: true,
} as const;