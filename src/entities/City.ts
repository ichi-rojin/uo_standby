// src/entities/City.ts
// 責務: 都市エンティティの生成ファクトリ（第2便で pendingChildren を追加）。

import { nextEntityId } from '../domain/ids';
import type { CityData, Vec2, QuestData } from '../domain/types';
import { Rng } from '../util/rng';

const CITY_PREFIX: readonly string[] = [
  'リオン', 'ガルド', 'ベルナ', 'カステル', 'ドラン', 'エルフィ', 'フォルト', 'グレイ',
  'ハーミ', 'イスト', 'ジェノ', 'カラル', 'ルミナ', 'ミドガ', 'ノルン', 'オアシ',
  'パルマ', 'クレス', 'ロセン', 'サリア',
];

const QUEST_TITLES: readonly string[] = [
  'モンスター討伐', '夜盗の砦調査', 'ダンジョン探索', '行方不明者の捜索', '隊商の護衛',
];

function rollQuests(rng: Rng): QuestData[] {
  const count = rng.int(1, 3);
  const quests: QuestData[] = [];
  for (let i = 0; i < count; i += 1) {
    quests.push({
      id: nextEntityId(),
      title: rng.pick(QUEST_TITLES),
      reward: rng.int(50, 500),
    });
  }
  return quests;
}

export function createCity(position: Vec2, index: number, rng: Rng): CityData {
  const baseName = index < CITY_PREFIX.length ? CITY_PREFIX[index] : `都市${index}`;
  return {
    id: nextEntityId(),
    name: `${baseName}市`,
    position: { x: position.x, y: position.y },
    population: rng.int(200, 2000),
    residentIds: new Set(),
    quests: rollQuests(rng),
    events: [],
    pendingChildren: [],
  };
}