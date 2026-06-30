// 責務: ゲーム全体のマジックナンバーを一元定義する定数モジュール
export const WORLD = {
  WIDTH: 12000,
  HEIGHT: 12000,
  EDGE_MARGIN: 600,
  CELL_SIZE: 400
} as const;

export const COUNTS = {
  CITIES: 40,
  VILLAGES: 200,
  NPC_MIN: 100,
  NPC_MAX: 255,
  MONSTER_MIN: 100,
  MONSTER_MAX: 500
} as const;

export const TIME = {
  // 1リアル秒あたりの進行ゲーム分(等速時)
  GAME_MINUTES_PER_SECOND: 60,
  START_YEAR: 512,
  START_MONTH: 1,
  START_DAY: 1,
  START_HOUR: 6,
  CHILD_MATURE_YEARS: 10
} as const;

export const CAMERA = {
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 3.0,
  ZOOM_STEP: 1.1,
  PAN_SPEED: 600
} as const;

export const STATS = {
  BASE_HP: 100,
  BASE_MP: 40,
  BASE_HEALTH: 100,
  HEALTH_DEBUFF_THRESHOLD: 60
} as const;

export const COMBAT = {
  RANGE_SWORD: 1,
  RANGE_POLE: 2,
  RANGE_BOW_MIN: 5,
  RANGE_BOW_MAX: 20,
  RANGE_MAGIC_MIN: 5,
  RANGE_MAGIC_MAX: 20,
  TILE: 32,
  ATTACK_COOLDOWN: 1.2
} as const;

export const RENDER = {
  NPC_RADIUS: 9,
  MONSTER_RADIUS: 10,
  CITY_RADIUS: 28,
  VILLAGE_RADIUS: 14,
  FORT_RADIUS: 20,
  BAR_WIDTH: 22,
  BAR_HEIGHT: 3,
  DEAD_GRAYSCALE_SECONDS: 30
} as const;

export const COLORS = {
  ROAD: 0x444450,
  GROUND: 0x1b2a1b,
  CITY: 0xddcc66,
  VILLAGE: 0x88aa66,
  FORT: 0x884444,
  NPC_GOOD: 0x66aaff,
  NPC_EVIL: 0xaa4466,
  MONSTER: 0x884488,
  TEXT: 0xddddee,
  HP: 0x33dd55,
  HP_BG: 0x551111,
  MP: 0x3366ff,
  MP_BG: 0x112255,
  DAMAGE: 0xff4444,
  HEAL: 0x44ff66,
  BUFF: 0xffdd33,
  DEBUFF: 0xaa44ff
} as const;

export const AI = {
  PERCEPTION_BASE: 200,
  WANDER_RADIUS: 800,
  ARRIVE_DIST: 24,
  REPLAN_INTERVAL: 2.5,
  IDLE_LIMIT: 8,
  NEED_DECAY: 0.4,
  SPEED_NPC: 70,
  SPEED_MONSTER: 55
} as const;

export const ASSETS = {
  // 外部画像差し替え用。空文字ならプロシージャル描画。
  USE_EXTERNAL: false,
  NPC: '',
  MONSTER: '',
  CITY: '',
  VILLAGE: '',
  FORT: ''
} as const;