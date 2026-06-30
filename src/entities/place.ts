// 責務: 都市・補給拠点・砦の拠点データモデル
import type { Vec2 } from '../domain/types';

export interface Quest {
  id: number;
  desc: string;
  takerName: string;
  done: boolean | null;
}

export class Place {
  id: number;
  kind: 'city' | 'supply' | 'fort';
  name: string;
  pos: Vec2;
  population: number;
  presentNpcIds: Set<number>;
  quests: Quest[];
  events: string[];
  childrenCount: number;
  decayed: boolean;

  constructor(id: number, kind: 'city' | 'supply' | 'fort', name: string, pos: Vec2) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.pos = pos;
    this.population = kind === 'city' ? 100 : 10;
    this.presentNpcIds = new Set();
    this.quests = [];
    this.events = [];
    this.childrenCount = 0;
    this.decayed = false;
  }
}