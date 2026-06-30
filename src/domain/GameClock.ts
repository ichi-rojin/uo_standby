// 責務: ゲーム内時刻管理と表示文字列生成
import { TIME } from '../config/constants';

export class GameClock {
  private totalMinutes: number;
  constructor() {
    this.totalMinutes =
      ((TIME.START_YEAR * 12 + (TIME.START_MONTH - 1)) * 30 + (TIME.START_DAY - 1)) * 24 * 60 +
      TIME.START_HOUR * 60;
  }
  get minutes(): number {
    return this.totalMinutes;
  }
  advance(gameMinutes: number): void {
    this.totalMinutes += gameMinutes;
  }
  format(): string {
    let m = Math.floor(this.totalMinutes);
    const min = m % 60;
    m = Math.floor(m / 60);
    const hour = m % 24;
    m = Math.floor(m / 24);
    const day = (m % 30) + 1;
    m = Math.floor(m / 30);
    const month = (m % 12) + 1;
    const year = Math.floor(m / 12);
    return `${year}年${month}月${day}日 ${hour}時:${String(min).padStart(2, '0')}`;
  }
  stamp(): string {
    let m = Math.floor(this.totalMinutes);
    m = Math.floor(m / 60);
    const hour = m % 24;
    m = Math.floor(m / 24);
    const day = (m % 30) + 1;
    m = Math.floor(m / 30);
    const month = (m % 12) + 1;
    const year = Math.floor(m / 12);
    return `${year}年${month}月${day}日 ${hour}時に`;
  }
  isNight(): boolean {
    const hour = Math.floor(this.totalMinutes / 60) % 24;
    return hour < 5 || hour >= 20;
  }
}