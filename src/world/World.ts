// File: src/world/World.ts
// 責務: ワールド状態の中核保持。エンティティ集合と空間グリッドを統合管理する。

import { SpatialGrid } from '../core/SpatialGrid';
import { WorldConfig } from '../config/GameConfig';
import { Character } from '../entities/Character';
import { City } from '../entities/City';
import { Supply } from '../entities/Supply';
import { Road } from '../entities/Road';

export class World {
  public readonly cities: City[];
  public readonly supplies: Supply[];
  public readonly roads: Road[];
  public readonly characters: Map<number, Character>;
  public readonly grid: SpatialGrid<Character>;

  constructor(cities: City[], supplies: Supply[], roads: Road[]) {
    this.cities = cities;
    this.supplies = supplies;
    this.roads = roads;
    this.characters = new Map();
    this.grid = new SpatialGrid<Character>(
      WorldConfig.WIDTH,
      WorldConfig.HEIGHT,
      WorldConfig.CELL_SIZE,
    );
  }

  public addCharacter(c: Character): void {
    this.characters.set(c.id, c);
    this.grid.insert(c);
  }

  public removeCharacter(c: Character): void {
    this.characters.delete(c.id);
    this.grid.remove(c);
  }

  public countMonsters(): number {
    let count = 0;
    for (const c of this.characters.values()) {
      if (c.kind === 'monster' && !c.isDead()) {
        count++;
      }
    }
    return count;
  }
}