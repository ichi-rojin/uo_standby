// File: src/core/RNG.ts
// 責務: 決定論的擬似乱数生成器。シード固定で再現可能な乱数を提供する。

export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 0x9e3779b9;
    }
  }

  public next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  public chance(p: number): boolean {
    return this.next() < p;
  }
}