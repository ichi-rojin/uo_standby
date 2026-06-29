// 責務: 補給拠点(村・駅)データモデル。

import { Vector2 } from './types';

export class SupplyPost {
  readonly id: number;
  readonly name: string;
  readonly x: number;
  readonly y: number;

  constructor(id: number, name: string, pos: Vector2) {
    this.id = id;
    this.name = name;
    this.x = pos.x;
    this.y = pos.y;
  }
}