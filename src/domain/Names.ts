// 責務: カタカナ姓名の自動生成(性別対応)
import type { Rng } from '../core/Rng';
import type { Gender } from './types';

const SURNAMES = [
  'アルド', 'ベルク', 'カイン', 'ドラン', 'エルフ', 'フェル', 'ガロ', 'ハイン',
  'イグナ', 'ジェイク', 'ケルン', 'ローエン', 'モルガ', 'ノルド', 'オーク', 'パル'
] as const;

const MALE = [
  'レオ', 'グレン', 'バルド', 'ジーク', 'ロイ', 'ガイ', 'ダグ', 'ヴァン'
] as const;

const FEMALE = [
  'リナ', 'エマ', 'ソフィ', 'ミラ', 'クレア', 'ユナ', 'セラ', 'ノア'
] as const;

const CITY_PREFIX = ['ブリ', 'トリン', 'ミナ', 'バロ', 'ヴェス', 'コーヴ', 'ヤファ', 'ムーン'] as const;
const CITY_SUFFIX = ['タニア', 'シティ', 'ホルム', 'ガード', 'フォール', 'ベイ'] as const;

export function genName(rng: Rng, gender: Gender): { surname: string; givenName: string } {
  return {
    surname: rng.pick(SURNAMES),
    givenName: gender === 'male' ? rng.pick(MALE) : rng.pick(FEMALE)
  };
}

export function genCityName(rng: Rng): string {
  return rng.pick(CITY_PREFIX) + rng.pick(CITY_SUFFIX);
}

export function genVillageName(rng: Rng, idx: number): string {
  return rng.pick(CITY_PREFIX) + '村' + idx;
}