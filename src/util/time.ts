// src/util/time.ts
// 責務: ゲーム内日時の前進・整形を担う。

import { TIME } from '../config/constants';
import type { GameDate } from '../domain/types';

export function createInitialDate(): GameDate {
  return {
    year: TIME.START_YEAR,
    month: TIME.START_MONTH,
    day: TIME.START_DAY,
    hour: TIME.START_HOUR,
  };
}

export function advanceHours(date: GameDate, hours: number): void {
  let totalHours = date.hour + hours;
  while (totalHours >= TIME.HOURS_PER_DAY) {
    totalHours -= TIME.HOURS_PER_DAY;
    date.day += 1;
    if (date.day > TIME.DAYS_PER_MONTH) {
      date.day = 1;
      date.month += 1;
      if (date.month > TIME.MONTHS_PER_YEAR) {
        date.month = 1;
        date.year += 1;
      }
    }
  }
  date.hour = Math.floor(totalHours);
}

export function formatDate(date: GameDate): string {
  return `${date.year}年${date.month}月${date.day}日 ${date.hour}時`;
}

export function cloneDate(date: GameDate): GameDate {
  return { year: date.year, month: date.month, day: date.day, hour: date.hour };
}