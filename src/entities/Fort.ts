// 責務: 砦データモデル(夜盗拠点・配下管理・朽ち判定)
import { Place } from './place';
import type { Vec2 } from '../domain/types';

export class Fort extends Place {
  members: Set<number>;

  constructor(id: number, name: string, pos: Vec2) {
    super(id, 'fort', name, pos);
    this.members = new Set();
    this.population = 0;
  }

  isEmpty(): boolean {
    return this.members.size === 0;
  }
}