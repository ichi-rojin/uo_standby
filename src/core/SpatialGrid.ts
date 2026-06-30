// File: src/core/SpatialGrid.ts
// 責務: 空間分割グリッド。O(N^2)を避け近傍エンティティ探索を高速に提供する。

export interface HasPosition {
  readonly id: number;
  x: number;
  y: number;
}

export class SpatialGrid<T extends HasPosition> {
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: Map<number, Set<T>>;
  private readonly itemCell: Map<number, number>;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Map();
    this.itemCell = new Map();
  }

  private cellIndex(x: number, y: number): number {
    let cx = Math.floor(x / this.cellSize);
    let cy = Math.floor(y / this.cellSize);
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cx >= this.cols) cx = this.cols - 1;
    if (cy >= this.rows) cy = this.rows - 1;
    return cy * this.cols + cx;
  }

  public insert(item: T): void {
    const idx = this.cellIndex(item.x, item.y);
    let set = this.cells.get(idx);
    if (!set) {
      set = new Set<T>();
      this.cells.set(idx, set);
    }
    set.add(item);
    this.itemCell.set(item.id, idx);
  }

  public remove(item: T): void {
    const idx = this.itemCell.get(item.id);
    if (idx === undefined) {
      return;
    }
    const set = this.cells.get(idx);
    if (set) {
      set.delete(item);
    }
    this.itemCell.delete(item.id);
  }

  public update(item: T): void {
    const oldIdx = this.itemCell.get(item.id);
    const newIdx = this.cellIndex(item.x, item.y);
    if (oldIdx === newIdx) {
      return;
    }
    if (oldIdx !== undefined) {
      const oldSet = this.cells.get(oldIdx);
      if (oldSet) {
        oldSet.delete(item);
      }
    }
    let newSet = this.cells.get(newIdx);
    if (!newSet) {
      newSet = new Set<T>();
      this.cells.set(newIdx, newSet);
    }
    newSet.add(item);
    this.itemCell.set(item.id, newIdx);
  }

  public queryRadius(x: number, y: number, radius: number): T[] {
    const result: T[] = [];
    const minCx = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCx = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minCy = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxCy = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
    const r2 = radius * radius;
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const set = this.cells.get(cy * this.cols + cx);
        if (!set) {
          continue;
        }
        for (const item of set) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) {
            result.push(item);
          }
        }
      }
    }
    return result;
  }

  public clear(): void {
    this.cells.clear();
    this.itemCell.clear();
  }
}