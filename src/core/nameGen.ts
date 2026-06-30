// 責務: 性別に応じたカタカナ姓名と通り名の生成
import type { Rng } from './rng';
import type { Gender } from '../domain/types';

const SURNAMES = ['ガルド', 'レイン', 'モルト', 'ヴェント', 'ザイン', 'クロウ', 'フェル', 'ドラン', 'ベルク', 'ソル'];
const MALE_NAMES = ['アレス', 'ガイ', 'ロイ', 'ダグ', 'ヴァン', 'ジーク', 'カイ', 'ボルド'];
const FEMALE_NAMES = ['リーナ', 'エルザ', 'ミア', 'ノア', 'セラ', 'イリス', 'ファナ', 'ルチア'];

export function genName(rng: Rng, gender: Gender): { sur: string; given: string } {
  const sur = rng.pick(SURNAMES);
  const given = gender === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
  return { sur, given };
}

export function genTitle(moral: number, honor: number, weapon: string): string {
  let core: string;
  if (moral <= -5) core = '無頼の';
  else if (moral >= 5) core = '高潔なる';
  else core = '流浪の';
  let rank: string;
  if (honor >= 60) rank = '英雄';
  else if (honor >= 30) rank = '騎士';
  else rank = '冒険者';
  const w =
    weapon === 'sword' ? '剣士' : weapon === 'pole' ? '槍兵' : weapon === 'bow' ? '射手' : '魔導士';
  return `${core}${rank}${w}`;
}