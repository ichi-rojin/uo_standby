// 責務: 近接遭遇による感情グラフ更新とアクシデント反映
import { EMOTION } from '../config/constants2';
import { adjustRelation, relationLabel } from './relationSystem';
import type { Character } from '../entities/character';

export interface EmotionEvent {
  aId: number;
  bId: number;
  label: string;
  text: string;
}

export function processEncounter(a: Character, b: Character): EmotionEvent | null {
  if (a.kind !== 'npc' || b.kind !== 'npc') return null;
  if (!a.alive || !b.alive) return null;
  const before = relationLabel(a.relations[b.id] ?? 0);
  const moralGap = Math.abs(a.ab.moral - b.ab.moral);
  const delta = moralGap < 5 ? EMOTION.ENCOUNTER_FRIEND_GAIN : -1;
  adjustRelation(a, b, delta);
  adjustRelation(b, a, delta);
  const after = relationLabel(a.relations[b.id] ?? 0);
  if (after !== before && after !== '中立') {
    return {
      aId: a.id,
      bId: b.id,
      label: after,
      text: `${a.fullName()}と${b.fullName()}は${after}の仲になった。`
    };
  }
  return null;
}

export function applyAccident(a: Character, b: Character): EmotionEvent {
  adjustRelation(a, b, EMOTION.ACCIDENT_PENALTY);
  adjustRelation(b, a, EMOTION.ACCIDENT_PENALTY);
  return {
    aId: a.id,
    bId: b.id,
    label: relationLabel(a.relations[b.id] ?? 0),
    text: `${a.fullName()}と${b.fullName()}の間に諍いが起きた。`
  };
}