// 責務: NPC間の相互感情の更新ロジック
import type { Character, RelationType } from '../domain/types';

function findRel(c: Character, targetId: number) {
  return c.relations.find((r) => r.targetId === targetId);
}

export function adjustRelation(c: Character, targetId: number, delta: number, type: RelationType): boolean {
  let rel = findRel(c, targetId);
  if (!rel) {
    rel = { targetId, type, value: 0 };
    c.relations.push(rel);
  }
  const prevType = rel.type;
  rel.value += delta;
  if (rel.value > 60) rel.type = 'friend';
  else if (rel.value > 30) rel.type = 'rival';
  else if (rel.value < -40) rel.type = 'hatred';
  else rel.type = type;
  return prevType !== rel.type;
}