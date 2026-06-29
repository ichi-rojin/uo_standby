// 責務: ゲーム全体のマジックナンバーを一元管理する定数群。
// すべての数値設定はここに集約し、コード中の直書きを禁止する。

export const WORLD = {
  /** ワールド幅(タイル数) */
  WIDTH_TILES: 320,
  /** ワールド高さ(タイル数) */
  HEIGHT_TILES: 320,
  /** 1タイルのピクセルサイズ */
  TILE_SIZE: 32,
  /** 端からの禁止マージン(タイル) */
  EDGE_MARGIN_TILES: 8,
} as const;

export const COUNTS = {
  /** NPC 数 */
  NPC: 100,
  /** モンスター下限 */
  MONSTER_MIN: 500,
  /** モンスター上限 */
  MONSTER_MAX: 1000,
  /** 都市数 */
  CITY: 20,
  /** 補給拠点数 */
  SUPPLY_POST: 100,
} as const;

export const SPATIAL = {
  /** 空間分割セルサイズ(ピクセル) */
  CELL_SIZE: 25,
} as const;

export const CAMERA = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4.0,
  DEFAULT_ZOOM: 0.6,
  /** ホイール1ノッチあたりのズーム倍率 */
  ZOOM_STEP: 1.1,
  /** WASD移動速度(ワールドpx/秒) */
  PAN_SPEED: 900,
} as const;

export const TIME = {
  /** 実時間1秒あたりに進むゲーム内分(等速時) */
  GAME_MINUTES_PER_REAL_SECOND: 0.1,
  /** 開始年 */
  START_YEAR: 1000,
  START_MONTH: 1,
  START_DAY: 1,
  START_HOUR: 6,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_MONTH: 30,
  MONTHS_PER_YEAR: 12,
} as const;

export const STATS_RANGE = {
  HP_MIN: 40,
  HP_MAX: 120,
  MP_MIN: 10,
  MP_MAX: 80,
  HEALTH_MAX: 100,
  ATTR_MIN: 5,
  ATTR_MAX: 30,
  SKILL_MIN: 0,
  SKILL_MAX: 100,
  /** 健康度がこの値を下回るとデバフ開始 */
  HEALTH_DEBUFF_THRESHOLD: 70,
} as const;

export const MOVEMENT = {
  /** NPC基本移動速度(ワールドpx/ゲーム秒) */
  NPC_BASE_SPEED: 18,
  /** モンスター基本移動速度 */
  MONSTER_BASE_SPEED: 14,
  /** 目的地到達とみなす距離 */
  ARRIVE_DIST: 12,
  /** 徘徊目的地再選択間隔(ゲーム分) */
  WANDER_REPICK_MINUTES: 30,
} as const;

export const COMBAT = {
  /** 攻撃判定範囲(ピクセル) */
  ATTACK_RANGE: 28,
  /** 攻撃クールダウン(ゲーム分) */
  ATTACK_COOLDOWN_MINUTES: 6,
  /** 索敵範囲(ピクセル) */
  AGGRO_RANGE: 220,
  /** 基礎ダメージ倍率 */
  DAMAGE_SCALE: 0.6,
  /** 最小ダメージ */
  MIN_DAMAGE: 1,
} as const;

export const RECOVERY = {
  /** 都市内HP回復(/ゲーム分) */
  CITY_HP_PER_MIN: 0.8,
  CITY_MP_PER_MIN: 0.6,
  CITY_HEALTH_PER_MIN: 0.4,
  /** 自然回復(野外, /ゲーム分) */
  FIELD_HP_PER_MIN: 0.05,
  FIELD_MP_PER_MIN: 0.08,
  /** 無行動禁止: この分以上無行動なら強制目的地再設定 */
  IDLE_LIMIT_MINUTES: 20,
} as const;

export const DEATH = {
  /** 死亡後グレースケール表示時間(ゲーム分) */
  GRAYSCALE_MINUTES: 720,
} as const;

export const SPAWN = {
  /** モンスター補充判定間隔(ゲーム分) */
  CHECK_INTERVAL_MINUTES: 15,
  /** 1回の補充数 */
  BATCH: 20,
} as const;

export const EFFECT = {
  /** ダメージ数字の寿命(ms) */
  DAMAGE_TEXT_LIFE_MS: 900,
  /** ヒットフラッシュ寿命(ms) */
  HIT_FLASH_LIFE_MS: 250,
  /** バフ/デバフリング寿命(ms) */
  AURA_LIFE_MS: 700,
} as const;

export const COLORS = {
  GRASS: 0x3c6e3c,
  GRASS_ALT: 0x356235,
  WATER: 0x2a4b7c,
  SAND: 0xc2b280,
  MOUNTAIN: 0x6b6b6b,
  ROAD: 0xaaaaaa,
  CITY: 0xd9b44a,
  SUPPLY: 0x8a6d3b,
  FORT: 0x552222,
  NPC_BODY: 0x4488ff,
  MONSTER_BASE: 0x884444,
  HP_BAR: 0x33cc33,
  HP_BAR_BG: 0x222222,
  MP_BAR: 0x3399ff,
  TEXT: 0xffffff,
  DAMAGE: 0xff5555,
  HEAL: 0x55ff88,
  BUFF: 0x66ccff,
  DEBUFF: 0xcc66ff,
} as const;

export const LOG = {
  MAX_EVENT_ENTRIES: 200,
  MAX_CONVERSATION_ENTRIES: 40,
} as const;