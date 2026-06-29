// src/spatial/SpatialGrid.ts
// 責務: 一様グリッドによる空間分割で近傍探索を O(N) 近似に抑える。O(N^2) 探索を禁止する。

import type { EntityId } from '../domain/ids';
import type { Vec2 } from '../domain/types';

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: Map<number, Set<EntityId>>;
  private readonly positions: Map<EntityId, Vec2>;

  constructor(worldWidth: number, worldHeight: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
    this.cells = new Map<number, Set<EntityId>>();
    this.positions = new Map<EntityId, Vec2>();
  }

  private cellIndex(x: number, y: number): number {
    const cx = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const cy = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return cy * this.cols + cx;
  }

  insert(id: EntityId, position: Vec2): void {
    const idx = this.cellIndex(position.x, position.y);
    let cell = this.cells.get(idx);
    if (!cell) {
      cell = new Set<EntityId>();
      this.cells.set(idx, cell);
    }
    cell.add(id);
    this.positions.set(id, { x: position.x, y: position.y });
  }

  remove(id: EntityId): void {
    const pos = this.positions.get(id);
    if (!pos) return;
    const idx = this.cellIndex(pos.x, pos.y);
    const cell = this.cells.get(idx);
    if (cell) cell.delete(id);
    this.positions.delete(id);
  }

  update(id: EntityId, position: Vec2): void {
    const old = this.positions.get(id);
    if (!old) {
      this.insert(id, position);
      return;
    }
    const oldIdx = this.cellIndex(old.x, old.y);
    const newIdx = this.cellIndex(position.x, position.y);
    if (oldIdx !== newIdx) {
      const oldCell = this.cells.get(oldIdx);
      if (oldCell) oldCell.delete(id);
      let newCell = this.cells.get(newIdx);
      if (!newCell) {
        newCell = new Set<EntityId>();
        this.cells.set(newIdx, newCell);
      }
      newCell.add(id);
    }
    old.x = position.x;
    old.y = position.y;
  }

  queryRadius(center: Vec2, radius: number): EntityId[] {
    const result: EntityId[] = [];
    const minCx = Math.max(0, Math.floor((center.x - radius) / this.cellSize));
    const maxCx = Math.min(this.cols - 1, Math.floor((center.x + radius) / this.cellSize));
    const minCy = Math.max(0, Math.floor((center.y - radius) / this.cellSize));
    const maxCy = Math.min(this.rows - 1, Math.floor((center.y + radius) / this.cellSize));
    const radiusSq = radius * radius;
    for (let cy = minCy; cy <= maxCy; cy += 1) {
      for (let cx = minCx; cx <= maxCx; cx += 1) {
        const cell = this.cells.get(cy * this.cols + cx);
        if (!cell) continue;
        for (const id of cell) {
          const pos = this.positions.get(id);
          if (!pos) continue;
          const dx = pos.x - center.x;
          const dy = pos.y - center.y;
          if (dx * dx + dy * dy <= radiusSq) {
            result.push(id);
          }
        }
      }
    }
    return result;
  }

  clear(): void {
    this.cells.clear();
    this.positions.clear();
  }
}