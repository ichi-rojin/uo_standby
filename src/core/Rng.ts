// 責務: 決定論的な擬似乱数生成器(mulberry32)。再現性のある乱数を提供。

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** 0以上1未満の浮動小数を返す */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** min以上max未満の浮動小数 */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** min以上max以下の整数 */
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** 配列からランダムに1要素を取得 */
  pick<T>(arr: readonly T[]): T {
    return arr[this.intRange(0, arr.length - 1)];
  }

  /** 真偽をp(0..1)の確率で返す */
  chance(p: number): boolean {
    return this.next() < p;
  }
}