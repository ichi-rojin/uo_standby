// src/entities/Fort.ts
// 責務: 砦エンティティの生成ファクトリを提供する。

import { nextEntityId } from '../domain/ids';
import type { FortData, Vec2 } from '../domain/types';

export function createFort(position: Vec2): FortData {
  return {
    id: nextEntityId(),
    position: { x: position.x, y: position.y },
    banditIds: new Set(),
  };
}