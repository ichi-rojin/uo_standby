// File: src/entities/City.ts
// 責務: 都市エンティティ。人口・滞在NPC・クエスト・都市内出来事を保持する。

import { Entity } from './Entity';

export interface CityEvent {
  stamp: string;
  text: string;
}

export interface CityQuest {
  id: number;
  text: string;
}

export class City extends Entity {
  public readonly name: string;
  public population: number;
  public readonly stayingNpcIds: Set<number>;
  public readonly storedChildren: { bornHour: number; gender: number }[];
  public readonly quests: CityQuest[];
  public readonly events: CityEvent[];

  constructor(x: number, y: number, name: string, population: number) {
    super(x, y);
    this.name = name;
    this.population = population;
    this.stayingNpcIds = new Set<number>();
    this.storedChildren = [];
    this.quests = [];
    this.events = [];
  }

  public addEvent(stamp: string, text: string): void {
    this.events.push({ stamp, text });
    if (this.events.length > 50) {
      this.events.shift();
    }
  }
}