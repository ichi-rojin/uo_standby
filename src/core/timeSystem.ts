// 責務: ゲーム内時間の進行と日時文字列化
import { TIME } from '../config/constants';

export class TimeSystem {
  private totalSeconds: number;

  constructor() {
    this.totalSeconds = 0;
  }

  advance(): void {
    this.totalSeconds += TIME.SECONDS_PER_TICK;
  }

  get tick(): number {
    return Math.floor(this.totalSeconds / TIME.SECONDS_PER_TICK);
  }

  format(): string {
    const totalMinutes = Math.floor(this.totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const hour = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const day = (totalDays % 30) + 1;
    const totalMonths = Math.floor(totalDays / 30);
    const month = (totalMonths % 12) + 1;
    const year = TIME.START_YEAR + Math.floor(totalMonths / 12);
    return `${year}年${month}月${day}日 ${hour}時`;
  }

  formatAtTick(tick: number): string {
    const sec = tick * TIME.SECONDS_PER_TICK;
    const totalMinutes = Math.floor(sec / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const hour = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const day = (totalDays % 30) + 1;
    const totalMonths = Math.floor(totalDays / 30);
    const month = (totalMonths % 12) + 1;
    const year = TIME.START_YEAR + Math.floor(totalMonths / 12);
    return `${year}年${month}月${day}日 ${hour}時`;
  }
}