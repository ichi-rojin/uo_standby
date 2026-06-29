// 責務: 一意な数値IDを連番で発行する。

export class IdGenerator {
  private current = 0;

  next(): number {
    this.current += 1;
    return this.current;
  }
}