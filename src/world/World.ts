// 責務: ワールド状態(地形/都市/拠点/砦/全キャラクター)の集約と近傍探索の提供。

import { COUNTS } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { City } from '../domain/City';
import { Fort } from '../domain/Fort';
import { SupplyPost } from '../domain/SupplyPost';
import { Rng } from '../core/Rng';
import { IdGenerator } from '../core/IdGenerator';
import { SpatialGrid } from '../core/SpatialGrid';
import { RoadNetwork } from './RoadNetwork';
import {
  GeneratedWorld,
  TerrainType,
  WorldGenerator,
} from './WorldGenerator';

export class World {
  terrain: TerrainType[] = [];
  cities: City[] = [];
  supplyPosts: SupplyPost[] = [];
  forts: Fort[] = [];
  characters: Character[] = [];

  readonly grid: SpatialGrid<Character> = new SpatialGrid<Character>();
  readonly roads: RoadNetwork = new RoadNetwork();

  readonly rng: Rng;
  readonly ids: IdGenerator;
  readonly generator: WorldGenerator;

  constructor(seed: number) {
    this.rng = new Rng(seed);
    this.ids = new IdGenerator();
    this.generator = new WorldGenerator(this.rng, this.ids);
  }

  generate(): void {
    const terrain = this.generator.generateTerrain();
    const cities = this.generator.generateCities(terrain);
    const posts = this.generator.generateSupplyPosts(terrain, cities);
    const gw: GeneratedWorld = { terrain, cities, supplyPosts: posts };
    this.terrain = gw.terrain;
    this.cities = gw.cities;
    this.supplyPosts = gw.supplyPosts;
    this.roads.build(this.cities, this.supplyPosts);

    this.spawnInitialNpcs();
    this.spawnInitialMonsters();
    this.rebuildGrid();
  }

  private spawnInitialNpcs(): void {
    for (let i = 0; i < COUNTS.NPC; i++) {
      const pos = this.generator.pickRespawnPosition(
        this.cities,
        this.supplyPosts
      );
      this.characters.push(
        this.generator.createCharacter('npc', pos, this.rng)
      );
    }
  }

  private spawnInitialMonsters(): void {
    const target = Math.floor(
      (COUNTS.MONSTER_MIN + COUNTS.MONSTER_MAX) / 2
    );
    for (let i = 0; i < target; i++) {
      const pos = this.generator.pickRespawnPosition(
        this.cities,
        this.supplyPosts
      );
      this.characters.push(
        this.generator.createCharacter('monster', pos, this.rng)
      );
    }
  }

  /** 生存キャラクターのみで空間グリッドを再構築 */
  rebuildGrid(): void {
    this.grid.clear();
    for (const c of this.characters) {
      if (c.alive) {
        this.grid.insert(c);
      }
    }
  }

  countAlive(kind: 'npc' | 'monster'): number {
    let n = 0;
    for (const c of this.characters) {
      if (c.alive && c.kind === kind) {
        n++;
      }
    }
    return n;
  }

  findCharacter(id: number): Character | undefined {
    return this.characters.find((c) => c.id === id);
  }

  addFort(fort: Fort): void {
    this.forts.push(fort);
  }
}