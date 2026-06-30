// 責務: 会話・掛け声・断末魔・魔法詠唱の文言生成
import type { Rng } from '../core/Rng';
import type { Character } from './types';

const MAGIC_NAMES = ['メギドラオン', 'イグニスボルト', 'フレアバースト', 'アイシクルレイン', 'サンダーゲイル'] as const;
const SPECIAL_NAMES = ['玉環歩鴛鴦脚', '金翅鳥王剣', '羅刹双破斬', '紫電一閃', '天魔覆滅'] as const;
const PRE_BRAVE = ['覚悟せよ', '喰らえ', '砕けよ', '・・・・', '我が一撃'] as const;
const GREET = ['よう、達者か', '神のご加護を', 'いい天気だな', '稼ぎはどうだ', '戦いに備えよ'] as const;
const HUNT_CRY = ['討ち取るぞ', '退治してくれる', '逃さんぞ', '我が剣の錆にしてやる'] as const;
const DEATH_CRY = ['ぐ、ここまでか…', '無念…', '母さん…', '我が魂は永遠なり…', 'うぐぁッ！'] as const;
const MONSTER_CRY = ['ギャアアア！', 'グルォォォ', 'シャアアッ', 'ウゴゴゴ…', 'キシャアア'] as const;

export function magicPhrase(rng: Rng): string {
  return `${rng.pick(PRE_BRAVE)}、${rng.pick(MAGIC_NAMES)}！`;
}

export function specialPhrase(rng: Rng): string {
  return `${rng.pick(PRE_BRAVE)}、${rng.pick(SPECIAL_NAMES)}！`;
}

export function greetPhrase(rng: Rng): string {
  return rng.pick(GREET);
}

export function huntPhrase(rng: Rng): string {
  return rng.pick(HUNT_CRY);
}

export function deathPhrase(rng: Rng, c: Character): string {
  if (c.kind !== 'npc') return rng.pick(MONSTER_CRY);
  return rng.pick(DEATH_CRY);
}

export function monsterCry(rng: Rng): string {
  return rng.pick(MONSTER_CRY);
}