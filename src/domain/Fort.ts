// 責務: 砦(夜盗拠点)データモデル。所属悪徳NPCがいなくなると消滅する。

import { Vector2 } from './types';

export class Fort {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** 所属悪徳NPCのID集合 */
  readonly members: Set<number> = new Set();
  alive = true;

  constructor(id: number, pos: Vector2) {
    this.id = id;
    this.x = pos.x;
    this.y = pos.y;
  }
}