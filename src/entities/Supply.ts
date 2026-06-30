// File: src/entities/Supply.ts
// 責務: 補給拠点（村・駅）エンティティ。道路網のノードとして機能する。

import { Entity } from './Entity';

export class Supply extends Entity {
  public readonly name: string;

  constructor(x: number, y: number, name: string) {
    super(x, y);
    this.name = name;
  }
}