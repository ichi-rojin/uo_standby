// src/world/WorldState.ts
// 責務: ワールド全体の可変状態を保持する（第2便で砦・感情グラフ用の補助参照を追加）。

import type {
  CharacterData,
  CityData,
  SupplyPostData,
  RoadSegment,
  EffectInstance,
  GameDate,
  FortData,
} from '../domain/types';
import type { EntityId } from '../domain/ids';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { WORLD, GRID } from '../config/constants';
import { CharacterKind, LifeState } from '../domain/enums';
import { createInitialDate } from '../util/time';

export class WorldState {
  readonly characters: Map<EntityId, CharacterData> = new Map();
  readonly cities: CityData[] = [];
  readonly supplyPosts: SupplyPostData[] = [];
  readonly forts: Map<EntityId, FortData> = new Map();
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
      if (c.kind !== CharacterKind.NPC && c.state === LifeState.Alive) count += 1;
    }
    return count;
  }
}