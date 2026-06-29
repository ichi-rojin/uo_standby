// 責務: ゲーム内時間の管理。再生/停止/倍速、Y年m月d日 H時表示の生成。

import { TIME } from '../config/GameConfig';

export type TimeScale = 0 | 1 | 2;

export class GameClock {
  /** 累積ゲーム内分(開始時刻を0とする) */
  private totalMinutes = 0;
  private scale: TimeScale = 1;

  setScale(scale: TimeScale): void {
    this.scale = scale;
  }

  getScale(): TimeScale {
    return this.scale;
  }

  /**
   * 実時間経過(秒)を受け取り、ゲーム内時間を進める。
   * @returns 進んだゲーム内分(他システムのdtに使用)
   */
  advance(realDeltaSeconds: number): number {
    if (this.scale === 0) {
      return 0;
    }
    const minutes =
      realDeltaSeconds *
      TIME.GAME_MINUTES_PER_REAL_SECOND *
      this.scale;
    this.totalMinutes += minutes;
    return minutes;
  }

  getTotalMinutes(): number {
    return this.totalMinutes;
  }

  /** 現在のカレンダー表現を返す */
  getCalendar(): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } {
    const totalMin = Math.floor(this.totalMinutes);
    const minute = totalMin % TIME.MINUTES_PER_HOUR;
    const totalHours = Math.floor(totalMin / TIME.MINUTES_PER_HOUR);
    const hourRaw = (totalHours + TIME.START_HOUR) % TIME.HOURS_PER_DAY;
    const totalDays =
      Math.floor((totalHours + TIME.START_HOUR) / TIME.HOURS_PER_DAY) +
      (TIME.START_DAY - 1);
    const day = (totalDays % TIME.DAYS_PER_MONTH) + 1;
    const totalMonths = Math.floor(totalDays / TIME.DAYS_PER_MONTH);
    const month = (totalMonths % TIME.MONTHS_PER_YEAR) + (TIME.START_MONTH - 1);
    const monthNorm = (month % TIME.MONTHS_PER_YEAR) + 1;
    const year =
      TIME.START_YEAR + Math.floor(totalMonths / TIME.MONTHS_PER_YEAR);
    return { year, month: monthNorm, day, hour: hourRaw, minute };
  }

  /** "Y年m月d日 H時" 形式の文字列 */
  formatHeader(): string {
    const c = this.getCalendar();
    return `${c.year}年${c.month}月${c.day}日 ${c.hour}時`;
  }

  /** ログprefix用 "Y年m月d日 H時に" */
  formatLogPrefix(): string {
    return `${this.formatHeader()}に`;
  }
}