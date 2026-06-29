// 責務: 一様格子による空間分割。近傍探索を O(N) 近似で提供し O(N^2) を回避する。

import { SPATIAL } from '../config/GameConfig';

interface SpatialEntity {
  id: number;
  x: number;
  y: number;
}

export class SpatialGrid<T extends SpatialEntity> {
  private readonly cellSize: number;
  private readonly cells: Map<number, T[]> = new Map();

  constructor(cellSize: number = SPATIAL.CELL_SIZE) {
    this.cellSize = cellSize;
  }

  private cellKey(cx: number, cy: number): number {
    // 16bit ずつにパック(ワールドが十分小さい前提)
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  private toCell(v: number): number {
    return Math.floor(v / this.cellSize);
  }

  clear(): void {
    this.cells.clear();
  }

  insert(entity: T): void {
    const key = this.cellKey(this.toCell(entity.x), this.toCell(entity.y));
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(entity);
  }

  /** 全エンティティを再投入する */
  rebuild(entities: readonly T[]): void {
    this.clear();
    for (const e of entities) {
      this.insert(e);
    }
  }

  /**
   * 指定座標から半径radius内のエンティティを収集する。
   * 周辺セルのみ走査するため全探索を回避できる。
   */
  queryRadius(x: number, y: number, radius: number, out: T[]): void {
    out.length = 0;
    const minCx = this.toCell(x - radius);
    const maxCx = this.toCell(x + radius);
    const minCy = this.toCell(y - radius);
    const maxCy = this.toCell(y + radius);
    const r2 = radius * radius;
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this.cells.get(this.cellKey(cx, cy));
        if (!bucket) {
          continue;
        }
        for (const e of bucket) {
          const dx = e.x - x;
          const dy = e.y - y;
          if (dx * dx + dy * dy <= r2) {
            out.push(e);
          }
        }
      }
    }
  }
}