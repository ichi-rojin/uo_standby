// 責務: 都市データモデル。滞在NPC・人口・出来事の保持。

import { Vector2 } from './types';

export interface CityEventEntry {
  text: string;
}

export class City {
  readonly id: number;
  readonly name: string;
  readonly x: number;
  readonly y: number;

  population: number;
  /** 現在滞在中のNPC ID集合 */
  readonly residents: Set<number> = new Set();
  readonly events: CityEventEntry[] = [];

  constructor(id: number, name: string, pos: Vector2, population: number) {
    this.id = id;
    this.name = name;
    this.x = pos.x;
    this.y = pos.y;
    this.population = population;
  }

  addEvent(text: string): void {
    this.events.push({ text });
    if (this.events.length > 50) {
      this.events.shift();
    }
  }
}