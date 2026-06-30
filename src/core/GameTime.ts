// File: src/core/GameTime.ts
// 責務: ゲーム内時間の管理。実時間経過からゲーム内年月日時を算出しフォーマットする。

import { TimeConfig } from '../config/GameConfig';

export class GameTime {
  private totalHours: number;
  private speed: number;
  private msAccumulator: number;

  constructor() {
    this.totalHours = 0;
    this.speed = TimeConfig.SPEED_NORMAL;
    this.msAccumulator = 0;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public advance(deltaMs: number): number {
    if (this.speed === TimeConfig.SPEED_PAUSE) {
      return 0;
    }
    this.msAccumulator += deltaMs * this.speed;
    let elapsedHours = 0;
    while (this.msAccumulator >= TimeConfig.REAL_MS_PER_GAME_HOUR) {
      this.msAccumulator -= TimeConfig.REAL_MS_PER_GAME_HOUR;
      this.totalHours += 1;
      elapsedHours += 1;
    }
    return elapsedHours;
  }

  public getTotalHours(): number {
    return this.totalHours;
  }

  public getYear(): number {
    const hoursPerYear =
      TimeConfig.HOURS_PER_DAY * TimeConfig.DAYS_PER_MONTH * TimeConfig.MONTHS_PER_YEAR;
    return TimeConfig.START_YEAR + Math.floor(this.totalHours / hoursPerYear);
  }

  public getMonth(): number {
    const hoursPerMonth = TimeConfig.HOURS_PER_DAY * TimeConfig.DAYS_PER_MONTH;
    const hoursPerYear = hoursPerMonth * TimeConfig.MONTHS_PER_YEAR;
    return TimeConfig.START_MONTH + Math.floor((this.totalHours % hoursPerYear) / hoursPerMonth);
  }

  public getDay(): number {
    const hoursPerDay = TimeConfig.HOURS_PER_DAY;
    const hoursPerMonth = hoursPerDay * TimeConfig.DAYS_PER_MONTH;
    return TimeConfig.START_DAY + Math.floor((this.totalHours % hoursPerMonth) / hoursPerDay);
  }

  public getHour(): number {
    return (TimeConfig.START_HOUR + this.totalHours) % TimeConfig.HOURS_PER_DAY;
  }

  public format(): string {
    return `${this.getYear()}年${this.getMonth()}月${this.getDay()}日 ${this.getHour()}時`;
  }

  public formatStamp(): string {
    return `${this.getYear()}年${this.getMonth()}月${this.getDay()}日 ${this.getHour()}時に`;
  }
}