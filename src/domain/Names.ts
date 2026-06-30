// File: src/domain/Names.ts
// 責務: 性別に応じたカタカナ姓名と通り名の自動生成。

import { RNG } from '../core/RNG';
import { Gender } from './types';

const FAMILY_NAMES: readonly string[] = [
  'アルド', 'ベルク', 'カイン', 'ドラン', 'エルフ', 'ガロ', 'ハイン', 'イグナ',
  'ジルバ', 'クロウ', 'ローエン', 'モルガ', 'ノルド', 'オルセン', 'パルム', 'クレイ',
  'ロウル', 'セルジュ', 'トルク', 'ヴァイス',
];

const MALE_NAMES: readonly string[] = [
  'アレク', 'ボルド', 'クリス', 'ダリオ', 'エイク', 'フェル', 'ガイ', 'ハル',
  'イヴァン', 'ジーク', 'クルト', 'レオ', 'マルス', 'ニコ', 'オーウェン', 'ロイ',
];

const FEMALE_NAMES: readonly string[] = [
  'アイナ', 'ベラ', 'セシル', 'ダナ', 'エリス', 'フィナ', 'グレタ', 'ハンナ',
  'イリス', 'ジェナ', 'カレン', 'ルナ', 'ミラ', 'ノラ', 'オリヴ', 'リタ',
];

const TITLE_PREFIX: readonly string[] = [
  '剛勇の', '静寂の', '紅蓮の', '蒼天の', '黄昏の', '不屈の', '俊足の', '賢慮の',
  '冷酷の', '慈愛の', '放浪の', '流転の',
];

const TITLE_SUFFIX: readonly string[] = [
  '剣士', '槍兵', '射手', '魔導士', '探索者', '守人', '討伐者', '無宿者',
];

export function generateName(rng: RNG, gender: Gender): { family: string; given: string } {
  const family = rng.pick(FAMILY_NAMES);
  const given =
    gender === Gender.Male ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
  return { family, given };
}

export function generateTitle(rng: RNG): string {
  return `${rng.pick(TITLE_PREFIX)}${rng.pick(TITLE_SUFFIX)}`;
}

export function generateMonsterCry(rng: RNG): string {
  const cries: readonly string[] = [
    'グルォォォ！', 'シャアアア！', 'ギギギ…', 'ガアアッ！', 'ヴヴヴ…',
    'キィィィ！', 'ゴガアア！', 'ヒュオオオ！',
  ];
  return rng.pick(cries);
}