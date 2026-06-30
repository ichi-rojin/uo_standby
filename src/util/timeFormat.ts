// 責務: ティック数を「Y年m月d日 H時」表記へ変換
import { TIME } from '../config/constants';

export function formatGameTime(tick: number): string {
  const totalHours = tick;
  const hour = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const day = (totalDays % 30) + 1;
  const totalMonths = Math.floor(totalDays / 30);
  const month = (totalMonths % 12) + 1;
  const year = TIME.START_YEAR + Math.floor(totalMonths / 12);
  return `${year}年${month}月${day}日 ${hour}時`;
}