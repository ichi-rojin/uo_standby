// 責務: 近傍探索のための空間分割グリッド（O(N^2)回避）
import { GRID, WORLD } from '../config/constants';
import type { EntityId } from '../domain/types';

type Point = { id: EntityId; x: number; y: number };

export class SpatialGrid {
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: Map<number, Point[]>;

  constructor() {
    this.cols = Math.ceil(WORLD.WIDTH / GRID.CELL_SIZE);
    this.rows = Math.ceil(WORLD.HEIGHT / GRID.CELL_SIZE);
    this.cells = new Map();
  }

  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  private cellOf(x: number, y: number): { cx: number; cy: number } {
    const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(x / GRID.CELL_SIZE)));
    const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(y / GRID.CELL_SIZE)));
    return { cx, cy };
  }

  clear(): void {
    this.cells.clear();
  }

  insert(id: EntityId, x: number, y: number): void {
    const { cx, cy } = this.cellOf(x, y);
    const k = this.key(cx, cy);
    const arr = this.cells.get(k);
    if (arr) {
      arr.push({ id, x, y });
    } else {
      this.cells.set(k, [{ id, x, y }]);
    }
  }

  queryRadius(x: number, y: number, radius: number, out: EntityId[]): void {
    out.length = 0;
    const r2 = radius * radius;
    const minCx = Math.max(0, Math.floor((x - radius) / GRID.CELL_SIZE));
    const maxCx = Math.min(this.cols - 1, Math.floor((x + radius) / GRID.CELL_SIZE));
    const minCy = Math.max(0, Math.floor((y - radius) / GRID.CELL_SIZE));
    const maxCy = Math.min(this.rows - 1, Math.floor((y + radius) / GRID.CELL_SIZE));
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const p = arr[i];
          const dx = p.x - x;
          const dy = p.y - y;
          if (dx * dx + dy * dy <= r2) out.push(p.id);
        }
      }
    }
  }
}