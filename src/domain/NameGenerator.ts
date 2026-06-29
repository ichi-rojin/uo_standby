// 責務: 性別に応じたカタカナ姓名・通り名の生成。

import { Rng } from '../core/Rng';
import { Gender, WeaponType } from './types';

const FAMILY = [
  'アシュ',
  'グレン',
  'ヴァル',
  'ロー',
  'ザイ',
  'ヘル',
  'ファ',
  'モル',
  'ティ',
  'ベル',
  'カイ',
  'ドラ',
  'ノル',
  'シュ',
  'ガル',
] as const;

const MALE_GIVEN = [
  'ガイ',
  'レオン',
  'バルド',
  'ジーク',
  'ロイ',
  'グスタフ',
  'ダリオ',
  'クロウ',
  'ヴェイン',
  'オルガ',
] as const;

const FEMALE_GIVEN = [
  'リナ',
  'エルマ',
  'ソフィ',
  'ミラ',
  'セレナ',
  'ユフィ',
  'クラリス',
  'ネル',
  'アイラ',
  'ヴィオラ',
] as const;

const TITLE_PREFIX = [
  '剣聖',
  '放浪の',
  '気高き',
  '血濡れの',
  '静寂の',
  '紅蓮の',
  '名もなき',
  '黄昏の',
  '不屈の',
  '影の',
] as const;

const TITLE_BY_WEAPON: Record<WeaponType, string> = {
  sword: '剣士',
  polearm: '槍兵',
  bow: '射手',
  none: '徒手',
};

const MONSTER_NAMES = [
  'ゴブリ',
  'ワーグ',
  'スライム',
  'コボル',
  'オーガ',
  'ハーピー',
  'ガーゴ',
  'リッチ',
  'ワイバ',
  'デーモ',
] as const;

export function generateNpcName(rng: Rng, gender: Gender): {
  family: string;
  given: string;
} {
  const family = rng.pick(FAMILY);
  const given =
    gender === 'male' ? rng.pick(MALE_GIVEN) : rng.pick(FEMALE_GIVEN);
  return { family, given };
}

export function generateMonsterName(rng: Rng): {
  family: string;
  given: string;
} {
  const family = rng.pick(MONSTER_NAMES);
  const given = `#${rng.intRange(1, 999)}`;
  return { family, given };
}

export function generateTitle(rng: Rng, weapon: WeaponType): string {
  return `${rng.pick(TITLE_PREFIX)}${TITLE_BY_WEAPON[weapon]}`;
}