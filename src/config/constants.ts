// 責務: ゲーム全体のマジックナンバーを集約する定数定義
export const WORLD = {
  WIDTH: 8000,
  HEIGHT: 8000,
  CELL_SIZE: 256
} as const;

export const COUNTS = {
  NPC: 100,
  MONSTER_MIN: 500,
  MONSTER_MAX: 1000,
  CITY: 20,
  SUPPLY: 100
} as const;

export const TIME = {
  TICK_MS: 100,
  SECONDS_PER_TICK: 1800,
  START_YEAR: 1000
} as const;

export const CAMERA = {
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 4,
  ZOOM_STEP: 1.1,
  MOVE_SPEED: 12
} as const;

export const ENTITY = {
  NPC_RADIUS: 10,
  MONSTER_RADIUS: 9,
  CITY_RADIUS: 26,
  SUPPLY_RADIUS: 14,
  BAR_WIDTH: 26,
  BAR_HEIGHT: 3,
  DEATH_GRAY_TICKS: 600
} as const;

export const COLORS = {
  BG: 0x223322,
  ROAD: 0x888888,
  CITY: 0xffd966,
  SUPPLY: 0xc0a060,
  NPC_MALE: 0x6699ff,
  NPC_FEMALE: 0xff88bb,
  BANDIT: 0x884444,
  HP: 0xff4444,
  MP: 0x4488ff,
  HEALTH: 0x44dd44,
  EFFECT_DMG: 0xff3333,
  EFFECT_HEAL: 0x33ff66,
  EFFECT_BUFF: 0xffff44,
  EFFECT_DEBUFF: 0xaa44ff
} as const;

export const LOG = {
  COLOR_DEATH: '#ff5555',
  COLOR_RELATION: '#55ff55',
  COLOR_TREASURE: '#ffd700',
  COLOR_MONEY: '#ffff55',
  COLOR_DEFAULT: '#dddddd',
  MAX_EVENT: 80,
  MAX_TALK: 12
} as const;

export const COMBAT = {
  SWORD_RANGE: 1 * 32,
  POLE_RANGE: 2 * 32,
  BOW_RANGE_BASE: 5 * 32,
  BOW_RANGE_MAX: 20 * 32,
  MAGIC_RANGE_BASE: 5 * 32,
  MAGIC_RANGE_MAX: 20 * 32,
  ATTACK_COOLDOWN_TICKS: 6
} as const;

export const NEED = {
  MAX: 100,
  DECAY: 0.05,
  HUNGER_HEALTH_DROP: 0.02
} as const;