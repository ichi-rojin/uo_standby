// File: src/domain/Relations.ts
// 責務: NPC間の相互感情値の保持と種別判定。友情・憎悪・好敵手・恋愛を分類する。

import { RelationConfig } from '../config/BehaviorConfig';

export enum RelationType {
  Neutral = 'neutral',
  Friend = 'friend',
  Rival = 'rival',
  Hate = 'hate',
  Love = 'love',
}

export class RelationStore {
  private readonly affinity: Map<number, Map<number, number>>;

  constructor() {
    this.affinity = new Map();
  }

  private ensure(a: number): Map<number, number> {
    let m = this.affinity.get(a);
    if (!m) {
      m = new Map();
      this.affinity.set(a, m);
    }
    return m;
  }

  public get(a: number, b: number): number {
    const m = this.affinity.get(a);
    if (!m) {
      return 0;
    }
    return m.get(b) ?? 0;
  }

  public adjust(a: number, b: number, delta: number): number {
    const m = this.ensure(a);
    const cur = m.get(b) ?? 0;
    let next = cur + delta;
    if (next > RelationConfig.MAX_RELATION) next = RelationConfig.MAX_RELATION;
    if (next < RelationConfig.MIN_RELATION) next = RelationConfig.MIN_RELATION;
    m.set(b, next);
    return next;
  }

  public classify(a: number, b: number): RelationType {
    const v = this.get(a, b);
    if (v >= RelationConfig.LOVE_THRESHOLD) {
      return RelationType.Love;
    }
    if (v >= RelationConfig.FRIEND_THRESHOLD) {
      return RelationType.Friend;
    }
    if (v <= RelationConfig.HATE_THRESHOLD) {
      return RelationType.Hate;
    }
    if (v >= RelationConfig.RIVAL_THRESHOLD) {
      return RelationType.Rival;
    }
    return RelationType.Neutral;
  }

  public removeEntity(id: number): void {
    this.affinity.delete(id);
    for (const m of this.affinity.values()) {
      m.delete(id);
    }
  }
}