// 責務: NPC同士の相互感情変化（友情・憎悪・好敵手・恋愛）と掛け合い生成
import { Rng } from '../util/rng';
import { clamp } from '../util/math';
import { RELATION } from '../config/constants';
import type { Character, EntityId } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_RELATION = 0x55ff55;

function relationLabel(value: number): string {
  if (value >= RELATION.LOVE) return '恋愛';
  if (value >= RELATION.FRIEND) return '友情';
  if (value <= RELATION.HATE) return '憎悪';
  if (value >= RELATION.RIVAL_LO && value <= RELATION.RIVAL_HI) return '好敵手';
  return '中立';
}

const FRIENDLY_TALK = ['共に行こう！', 'よき出会いだ。', '今日もよろしく頼む。'];
const HOSTILE_TALK = ['貴様、許さん！', '消えろ！', '目障りだ。'];
const RIVAL_TALK = ['また会ったな、好敵手よ。', '勝負は預けたぞ。'];

export function interact(rng: Rng, state: GameState, a: Character, b: Character): void {
  const sameSide = (a.kind === 'npc' && b.kind === 'npc');
  if (!sameSide) return;

  const cur = a.relations.get(b.id) ?? 0;
  let delta = rng.range(-5, 8);
  if (a.personality.sociability > 0.6) delta += 3;
  const next = clamp(cur + delta, RELATION.MIN, RELATION.MAX);
  const prevLabel = relationLabel(cur);
  a.relations.set(b.id, next);
  b.relations.set(a.id, clamp((b.relations.get(a.id) ?? 0) + delta, RELATION.MIN, RELATION.MAX));

  const label = relationLabel(next);
  if (label !== prevLabel) {
    state.addEvent(`${displayName(a)} と ${displayName(b)} が ${label} の関係に`, COLOR_RELATION, [a.id, b.id]);
    a.history.push({ stamp: '', text: `${displayName(b)}と${label}の関係になった` });
  }

  if (rng.chance(0.25)) {
    const text =
      next >= RELATION.FRIEND ? rng.pick(FRIENDLY_TALK)
        : next <= RELATION.HATE ? rng.pick(HOSTILE_TALK)
          : rng.pick(RIVAL_TALK);
    state.addTalk(a.id, b.id, text);
  }
}

export function isHostileRelation(a: Character, b: EntityId): boolean {
  return (a.relations.get(b) ?? 0) <= RELATION.HATE;
}