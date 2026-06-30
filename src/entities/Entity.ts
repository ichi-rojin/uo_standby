// File: src/entities/Entity.ts
// 責務: 全エンティティ共通の基底。一意IDと座標を保持する。

let nextId = 1;

export function nextEntityId(): number {
  return nextId++;
}

export abstract class Entity {
  public readonly id: number;
  public x: number;
  public y: number;

  protected constructor(x: number, y: number) {
    this.id = nextEntityId();
    this.x = x;
    this.y = y;
  }
}