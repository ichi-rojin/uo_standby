// src/social/ChatGenerator.ts
// 責務: 状況（出会い・戦闘・死亡）に応じた掛け合い・掛け声・断末魔のセリフ文字列を生成する。

import type { CharacterData } from '../domain/types';
import { RelationKind } from '../domain/enums';
import { Rng } from '../util/rng';

const FRIEND_LINES: readonly string[] = ['また会えたな！', '元気そうで何よりだ。', '一緒に狩りに行こう。'];
const HATE_LINES: readonly string[] = ['貴様、まだ生きていたか。', '顔も見たくない。', '今度こそ決着をつけよう。'];
const RIVAL_LINES: readonly string[] = ['いい腕だ、負けないぞ。', '次は私が上だ。', '良き好敵手よ。'];
const LOVE_LINES: readonly string[] = ['君に会いたかった。', 'ずっと側にいたい。', '愛しているよ。'];
const NEUTRAL_LINES: readonly string[] = ['よい天気だな。', '旅は順調か？', '気をつけて行けよ。'];

const COMBAT_SHOUTS: readonly string[] = ['覚悟しろ！', 'いざ尋常に！', '退かぬ！', 'この一撃で決める！'];
const DEATH_LINES: readonly string[] = ['ここまでか…', '無念…', '後を…頼む…', 'まだ…死ねぬ…'];

export function relationChat(rng: Rng, kind: RelationKind): string {
  switch (kind) {
    case RelationKind.Friend:
      return rng.pick(FRIEND_LINES);
    case RelationKind.Hate:
      return rng.pick(HATE_LINES);
    case RelationKind.Rival:
      return rng.pick(RIVAL_LINES);
    case RelationKind.Love:
      return rng.pick(LOVE_LINES);
    default:
      return rng.pick(NEUTRAL_LINES);
  }
}

export function combatShout(rng: Rng, target: CharacterData): string {
  return `${target.familyName}め、${rng.pick(COMBAT_SHOUTS)}`;
}

export function deathLine(rng: Rng): string {
  return rng.pick(DEATH_LINES);
}