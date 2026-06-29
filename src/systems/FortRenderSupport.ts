// src/systems/FortRenderSupport.ts
// 責務: 砦レンダラへ渡す砦座標スナップショットを生成する（描画と状態の橋渡し）。

import { WorldState } from '../world/WorldState';
import type { Vec2 } from '../domain/types';
import type { EntityId } from '../domain/ids';

export interface FortSnapshot {
  id: EntityId;
  position: Vec2;
}

export function snapshotForts(world: WorldState): FortSnapshot[] {
  const result: FortSnapshot[] = [];
  for (const fort of world.forts.values()) {
    result.push({ id: fort.id, position: { x: fort.position.x, y: fort.position.y } });
  }
  return result;
}