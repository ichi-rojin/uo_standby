// src/world/WorldState.ts
// 責務: ワールド全体の可変状態（キャラ・都市・補給拠点・道路・エフェクト・日時・空間グリッド）を保持する。

import type {
  CharacterData,
  CityData,
  SupplyPostData,
  RoadSegment,
  EffectInstance,
  GameDate,
} from '../domain/types';
import type { EntityId } from '../domain/ids';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { WORLD, GRID } from '../config/constants';
import { createInitialDate } from '../util/time';

export class WorldState {
  readonly characters: Map<EntityId, CharacterData> = new Map();
  readonly cities: CityData[] = [];
  readonly supplyPosts: SupplyPostData[] = [];
  roads: RoadSegment[] = [];
  readonly effects: EffectInstance[] = [];
  readonly grid: SpatialGrid;
  readonly date: GameDate;

  constructor() {
    this.grid = new SpatialGrid(WORLD.WIDTH, WORLD.HEIGHT, GRID.CELL_SIZE);
    this.date = createInitialDate();
  }

  addCharacter(c: CharacterData): void {
    this.characters.set(c.id, c);
    this.grid.insert(c.id, c.position);
  }

  removeCharacter(id: EntityId): void {
    this.characters.delete(id);
    this.grid.remove(id);
  }

  countAliveMonsters(): number {
    let count = 0;
    for (const c of this.characters.values()) {
      if (c.kind !== 'NPC' && c.state === 'ALIVE') count += 1;
    }
    return count;
  }
}