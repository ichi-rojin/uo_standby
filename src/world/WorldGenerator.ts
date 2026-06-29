// 責務: ワールド地形・都市・補給拠点・キャラクターの初期生成。
// リスポーン三角形領域(都市1+近傍2拠点)の算出も提供。

import { COLORS, COUNTS, STATS_RANGE, WORLD } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { City } from '../domain/City';
import { SupplyPost } from '../domain/SupplyPost';
import { Vector2 } from '../domain/types';
import { IdGenerator } from '../core/IdGenerator';
import { Rng } from '../core/Rng';

export type TerrainType = 'water' | 'sand' | 'grass' | 'mountain';

const CITY_NAME_PARTS_A = [
  'エル',
  'ノヴァ',
  'ヴァル',
  'アル',
  'グラン',
  'ミド',
  'リオ',
  'カル',
  'ベル',
  'ソル',
] as const;
const CITY_NAME_PARTS_B = [
  'ガード',
  'ハイム',
  'ポート',
  'ブルク',
  'トン',
  'ディア',
  'ローズ',
  'ヘイブン',
  'フォード',
  'ゲート',
] as const;

export interface GeneratedWorld {
  terrain: TerrainType[];
  cities: City[];
  supplyPosts: SupplyPost[];
}

export class WorldGenerator {
  constructor(
    private readonly rng: Rng,
    private readonly ids: IdGenerator
  ) {}

  generateTerrain(): TerrainType[] {
    const w = WORLD.WIDTH_TILES;
    const h = WORLD.HEIGHT_TILES;
    const terrain: TerrainType[] = new Array(w * h);
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / maxR;
        const noise = this.valueNoise(x, y);
        const v = dist - noise * 0.35;
        let t: TerrainType;
        if (v > 0.95) {
          t = 'water';
        } else if (v > 0.85) {
          t = 'sand';
        } else if (noise > 0.78) {
          t = 'mountain';
        } else {
          t = 'grass';
        }
        terrain[y * w + x] = t;
      }
    }
    return terrain;
  }

  private valueNoise(x: number, y: number): number {
    // 安定した擬似ノイズ(複数sinの合成)
    const n =
      Math.sin(x * 0.13 + 1.7) * 0.5 +
      Math.cos(y * 0.11 - 0.4) * 0.3 +
      Math.sin((x + y) * 0.07) * 0.2;
    return (n + 1) / 2;
  }

  generateCities(terrain: TerrainType[]): City[] {
    const cities: City[] = [];
    const margin = WORLD.EDGE_MARGIN_TILES;
    let guard = 0;
    while (cities.length < COUNTS.CITY && guard < COUNTS.CITY * 200) {
      guard++;
      const tx = this.rng.intRange(margin, WORLD.WIDTH_TILES - margin - 1);
      const ty = this.rng.intRange(margin, WORLD.HEIGHT_TILES - margin - 1);
      if (terrain[ty * WORLD.WIDTH_TILES + tx] !== 'grass') {
        continue;
      }
      const pos = this.tileCenter(tx, ty);
      if (this.tooClose(pos, cities, WORLD.TILE_SIZE * 18)) {
        continue;
      }
      const name = `${this.rng.pick(CITY_NAME_PARTS_A)}${this.rng.pick(
        CITY_NAME_PARTS_B
      )}`;
      cities.push(
        new City(
          this.ids.next(),
          name,
          pos,
          this.rng.intRange(80, 400)
        )
      );
    }
    return cities;
  }

  generateSupplyPosts(
    terrain: TerrainType[],
    cities: readonly City[]
  ): SupplyPost[] {
    const posts: SupplyPost[] = [];
    const margin = WORLD.EDGE_MARGIN_TILES;
    let guard = 0;
    while (
      posts.length < COUNTS.SUPPLY_POST &&
      guard < COUNTS.SUPPLY_POST * 200
    ) {
      guard++;
      const tx = this.rng.intRange(margin, WORLD.WIDTH_TILES - margin - 1);
      const ty = this.rng.intRange(margin, WORLD.HEIGHT_TILES - margin - 1);
      if (terrain[ty * WORLD.WIDTH_TILES + tx] === 'water') {
        continue;
      }
      const pos = this.tileCenter(tx, ty);
      if (this.tooClose(pos, cities, WORLD.TILE_SIZE * 6)) {
        continue;
      }
      if (this.tooClosePost(pos, posts, WORLD.TILE_SIZE * 6)) {
        continue;
      }
      posts.push(
        new SupplyPost(this.ids.next(), `村${posts.length + 1}`, pos)
      );
    }
    return posts;
  }

  /**
   * リスポーン領域算出: 都市1つ+近傍2拠点で三角形を作り、その内部の点を返す。
   * 画面端は禁止(都市・拠点が既にマージン内のため自然に満たされる)。
   */
  pickRespawnPosition(
    cities: readonly City[],
    posts: readonly SupplyPost[]
  ): Vector2 {
    const city = this.rng.pick(cities);
    const nearby = this.twoNearest(city, posts, cities);
    const p1: Vector2 = { x: city.x, y: city.y };
    const p2 = nearby[0];
    const p3 = nearby[1];
    let r1 = this.rng.next();
    let r2 = this.rng.next();
    if (r1 + r2 > 1) {
      r1 = 1 - r1;
      r2 = 1 - r2;
    }
    return {
      x: p1.x + r1 * (p2.x - p1.x) + r2 * (p3.x - p1.x),
      y: p1.y + r1 * (p2.y - p1.y) + r2 * (p3.y - p1.y),
    };
  }

  private twoNearest(
    city: City,
    posts: readonly SupplyPost[],
    cities: readonly City[]
  ): Vector2[] {
    const candidates: Vector2[] = [];
    for (const p of posts) {
      candidates.push({ x: p.x, y: p.y });
    }
    for (const c of cities) {
      if (c.id !== city.id) {
        candidates.push({ x: c.x, y: c.y });
      }
    }
    candidates.sort((a, b) => {
      const da = (a.x - city.x) ** 2 + (a.y - city.y) ** 2;
      const db = (b.x - city.x) ** 2 + (b.y - city.y) ** 2;
      return da - db;
    });
    if (candidates.length >= 2) {
      return [candidates[0], candidates[1]];
    }
    // フォールバック(理論上到達しないが安全策)
    return [
      { x: city.x + WORLD.TILE_SIZE * 4, y: city.y },
      { x: city.x, y: city.y + WORLD.TILE_SIZE * 4 },
    ];
  }

  createCharacter(
    kind: 'npc' | 'monster',
    pos: Vector2,
    rng: Rng
  ): Character {
    return new Character({
      id: this.ids.next(),
      kind,
      position: pos,
      rng,
    });
  }

  private tileCenter(tx: number, ty: number): Vector2 {
    return {
      x: tx * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2,
      y: ty * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2,
    };
  }

  private tooClose(
    pos: Vector2,
    cities: readonly City[],
    minDist: number
  ): boolean {
    const min2 = minDist * minDist;
    for (const c of cities) {
      const dx = c.x - pos.x;
      const dy = c.y - pos.y;
      if (dx * dx + dy * dy < min2) {
        return true;
      }
    }
    return false;
  }

  private tooClosePost(
    pos: Vector2,
    posts: readonly SupplyPost[],
    minDist: number
  ): boolean {
    const min2 = minDist * minDist;
    for (const p of posts) {
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      if (dx * dx + dy * dy < min2) {
        return true;
      }
    }
    return false;
  }
}

/** 地形タイプから色を取得 */
export function terrainColor(t: TerrainType, alt: boolean): number {
  switch (t) {
    case 'water':
      return COLORS.WATER;
    case 'sand':
      return COLORS.SAND;
    case 'mountain':
      return COLORS.MOUNTAIN;
    case 'grass':
    default:
      return alt ? COLORS.GRASS_ALT : COLORS.GRASS;
  }
}

/** 健康度の最大定数を外部公開(UI整合用) */
export const HEALTH_MAX = STATS_RANGE.HEALTH_MAX;