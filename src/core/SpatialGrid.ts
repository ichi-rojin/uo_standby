// 責務: 一様グリッドによる空間分割(近傍探索 O(1)平均, O(N²)回避)
import type { Vec2 } from './Vec2';

export class SpatialGrid<T extends { pos: Vec2 }> {
  private cells: Map<number, T[]> = new Map();
  private readonly cols: number;
  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly cellSize: number
  ) {
    this.cols = Math.ceil(width / cellSize);
  }
  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }
  private cellCoord(p: Vec2): { cx: number; cy: number } {
    return {
      cx: Math.max(0, Math.min(this.cols - 1, Math.floor(p.x / this.cellSize))),
      cy: Math.max(0, Math.min(Math.ceil(this.height / this.cellSize) - 1, Math.floor(p.y / this.cellSize)))
    };
  }
  clear(): void {
    this.cells.clear();
  }
  insert(item: T): void {
    const { cx, cy } = this.cellCoord(item.pos);
    const k = this.key(cx, cy);
    const arr = this.cells.get(k);
    if (arr) arr.push(item);
    else this.cells.set(k, [item]);
  }
  rebuild(items: readonly T[]): void {
    this.clear();
    for (const it of items) this.insert(it);
  }
  queryRadius(center: Vec2, radius: number): T[] {
    const result: T[] = [];
    const r = Math.ceil(radius / this.cellSize);
    const { cx, cy } = this.cellCoord(center);
    const radiusSq = radius * radius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const arr = this.cells.get(this.key(cx + dx, cy + dy));
        if (!arr) continue;
        for (const it of arr) {
          const ddx = it.pos.x - center.x;
          const ddy = it.pos.y - center.y;
          if (ddx * ddx + ddy * ddy <= radiusSq) result.push(it);
        }
      }
    }
    return result;
  }
}