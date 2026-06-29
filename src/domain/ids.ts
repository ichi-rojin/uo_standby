// src/domain/ids.ts
// 責務: 一意なエンティティIDを生成・型付けする。

export type EntityId = number & { readonly __brand: 'EntityId' };

let counter = 0;

export function nextEntityId(): EntityId {
  counter += 1;
  return counter as EntityId;
}