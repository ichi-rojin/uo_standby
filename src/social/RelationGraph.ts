// src/social/RelationGraph.ts
// 責務: NPC間の相互感情値（友情・憎悪・好敵手・恋愛）を疎な隣接マップで管理し、関係種別を導出する。

import type { EntityId } from '../domain/ids';
import { RelationKind } from '../domain/enums';
import { RELATION } from '../config/aiConfig';
import { clamp } from '../util/math';

function pairKey(a: EntityId, b: EntityId): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export class RelationGraph {
  private readonly values: Map<string, number> = new Map();

  get(a: EntityId, b: EntityId): number {
    if (a === b) return 0;
    return this.values.get(pairKey(a, b)) ?? 0;
  }

  adjust(a: EntityId, b: EntityId, delta: number): number {
    if (a === b) return 0;
    const key = pairKey(a, b);
    const current = this.values.get(key) ?? 0;
    const next = clamp(current + delta, RELATION.MIN, RELATION.MAX);
    this.values.set(key, next);
    return next;
  }

  kindOf(a: EntityId, b: EntityId): RelationKind {
    const v = this.get(a, b);
    if (v >= RELATION.LOVE_THRESHOLD) return RelationKind.Love;
    if (v >= RELATION.FRIEND_THRESHOLD) return RelationKind.Friend;
    if (v <= RELATION.HATE_THRESHOLD) return RelationKind.Hate;
    if (v >= RELATION.RIVAL_THRESHOLD) return RelationKind.Rival;
    return RelationKind.Neutral;
  }

  decay(): void {
    for (const [key, value] of this.values) {
      if (value > 0) {
        const next = Math.max(0, value - RELATION.DECAY_PER_DAY);
        this.values.set(key, next);
      } else if (value < 0) {
        const next = Math.min(0, value + RELATION.DECAY_PER_DAY);
        this.values.set(key, next);
      }
    }
  }

  removeEntity(id: EntityId): void {
    for (const key of [...this.values.keys()]) {
      if (key.startsWith(`${id}_`) || key.endsWith(`_${id}`)) {
        this.values.delete(key);
      }
    }
  }
}