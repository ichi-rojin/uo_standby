// 責務: 空間分割による近傍探索 (O(N^2)回避)
import { WORLD } from '../config/constants';
import type { Vec2 } from '../domain/types';

export class SpatialGrid {
  private cols: number;
  private rows: number;
  private cells: Map<number, Set<number>>;
  private cellSize: number;

  constructor() {
    this.cellSize = WORLD.CELL_SIZE;
    this.cols = Math.ceil(WORLD.WIDTH / this.cellSize);
    this.rows = Math.ceil(WORLD.HEIGHT / this.cellSize);
    this.cells = new Map();
  }

  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  private cellOf(pos: Vec2): { cx: number; cy: number } {
    const cx = Math.max(0, Math.min(this.cols - 1, Math.floor(pos.x / this.cellSize)));
    const cy = Math.max(0, Math.min(this.rows - 1, Math.floor(pos.y / this.cellSize)));
    return { cx, cy };
  }

  clear(): void {
    this.cells.clear();
  }

  insert(id: number, pos: Vec2): void {
    const { cx, cy } = this.cellOf(pos);
    const k = this.key(cx, cy);
    let set = this.cells.get(k);
    if (!set) {
      set = new Set();
      this.cells.set(k, set);
    }
    set.add(id);
  }

  queryRadius(pos: Vec2, radius: number): number[] {
    const result: number[] = [];
    const minCx = Math.max(0, Math.floor((pos.x - radius) / this.cellSize));
    const maxCx = Math.min(this.cols - 1, Math.floor((pos.x + radius) / this.cellSize));
    const minCy = Math.max(0, Math.floor((pos.y - radius) / this.cellSize));
    const maxCy = Math.min(this.rows - 1, Math.floor((pos.y + radius) / this.cellSize));
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const set = this.cells.get(this.key(cx, cy));
        if (set) {
          for (const id of set) {
            result.push(id);
          }
        }
      }
    }
    return result;
  }
}