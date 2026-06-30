// File: src/entities/Fort.ts
// 責務: 夜盗がたむろする砦。所属悪徳NPCを管理し、空になると朽ちる判定を提供する。

import { Entity } from './Entity';

export class Fort extends Entity {
  public readonly memberIds: Set<number>;
  public decayed: boolean;

  constructor(x: number, y: number, founderId: number) {
    super(x, y);
    this.memberIds = new Set<number>();
    this.memberIds.add(founderId);
    this.decayed = false;
  }

  public addMember(id: number): void {
    this.memberIds.add(id);
  }

  public removeMember(id: number): void {
    this.memberIds.delete(id);
  }

  public isEmpty(): boolean {
    return this.memberIds.size === 0;
  }
}