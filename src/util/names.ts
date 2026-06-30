// 責務: カタカナ姓名・通り名・スキル名のプロシージャル生成
import type { Rng } from './rng';
import type { Sex, WeaponKind } from '../domain/types';

const SURNAMES = [
  'アル', 'ベル', 'カド', 'ドラ', 'エル', 'ファ', 'ガル', 'ハイ', 'イル', 'ジン',
  'カイ', 'ロー', 'モル', 'ノヴ', 'オー', 'ペル', 'クォ', 'レイ', 'シュ', 'トル',
];
const SUR_SUFFIX = ['ガード', 'ハイム', 'ベルク', 'ストン', 'ウィン', 'ロード', 'フェル', 'モンド'];

const MALE_NAMES = ['ガイ', 'レオ', 'ザイン', 'ボルド', 'グレン', 'ダイン', 'ロイ', 'クルト', 'バルド', 'ゲオル'];
const FEMALE_NAMES = ['リナ', 'エマ', 'セラ', 'ミラ', 'ノア', 'リズ', 'フィー', 'アヤ', 'ソフィ', 'ルナ'];

const CITY_PREFIX = ['ブライト', 'ストーン', 'ゴールド', 'シルバー', 'ダーク', 'ハイ', 'グレン', 'リバー', 'サン', 'ムーン'];
const CITY_SUFFIX = ['ポート', 'ブルク', 'ヘイヴン', 'フォード', 'ゲート', 'ホルム', 'ターン', 'ヴェイル'];

const SPELLS_ATTACK = ['ファイアボルト', 'サンダー', 'アイスランス', 'メギド', 'フレア'];
const SPELLS_HEAL = ['ヒール', 'キュア', 'リジェネ'];
const SPELLS_BUFF = ['ブレイブ', 'ヘイスト', 'プロテス'];
const SPELLS_DEBUFF = ['ポイズン', 'スロウ', 'カース'];

const SPECIALS_SWORD = ['金翅鳥王剣', '飛燕連斬', '断空剣'];
const SPECIALS_POLE = ['旋風突', '螺旋穿'];
const SPECIALS_BOW = ['烈火連矢', '一閃貫'];
const SPECIALS_MAGIC = ['玉環歩鴛鴦脚', '天雷招来'];

export function genLastName(rng: Rng): string {
  return rng.pick(SURNAMES) + rng.pick(SUR_SUFFIX);
}

export function genFirstName(rng: Rng, sex: Sex): string {
  return sex === 'male' ? rng.pick(MALE_NAMES) : rng.pick(FEMALE_NAMES);
}

export function genCityName(rng: Rng): string {
  return rng.pick(CITY_PREFIX) + rng.pick(CITY_SUFFIX);
}

export function genVillageName(rng: Rng, idx: number): string {
  return `${rng.pick(SURNAMES)}村${idx}`;
}

export function spellsFor(kind: MagicKindLocal): readonly string[] {
  switch (kind) {
    case 'attack':
      return SPELLS_ATTACK;
    case 'heal':
      return SPELLS_HEAL;
    case 'buff':
      return SPELLS_BUFF;
    case 'debuff':
      return SPELLS_DEBUFF;
  }
}

type MagicKindLocal = 'attack' | 'heal' | 'buff' | 'debuff';

export function specialsFor(weapon: WeaponKind): readonly string[] {
  switch (weapon) {
    case 'sword':
      return SPECIALS_SWORD;
    case 'pole':
      return SPECIALS_POLE;
    case 'bow':
      return SPECIALS_BOW;
    case 'magic':
      return SPECIALS_MAGIC;
  }
}