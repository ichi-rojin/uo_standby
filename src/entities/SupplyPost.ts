// src/entities/SupplyPost.ts
// 責務: 補給拠点（村・駅）エンティティの生成ファクトリを提供する。

import { nextEntityId } from '../domain/ids';
import type { SupplyPostData, Vec2 } from '../domain/types';

export function createSupplyPost(position: Vec2, index: number): SupplyPostData {
  return {
    id: nextEntityId(),
    name: `補給拠点${index + 1}`,
    position: { x: position.x, y: position.y },
  };
}