// 責務: クエストの発注・受託・達成判定と報酬付与
import { Rng } from '../util/rng';
import { allocId } from '../factory/characterFactory';
import type { Character, City, Quest, QuestType } from '../domain/types';
import type { GameState } from '../state/gameState';
import { displayName } from './combatSystem';

const COLOR_TREASURE = 0xffd700;
const COLOR_MONEY = 0xffff00;

const QUEST_TYPES: readonly QuestType[] = ['slayBoss', 'slayBandit', 'dungeon', 'escort', 'delivery', 'assassinate'];

function describe(type: QuestType): string {
  switch (type) {
    case 'slayBoss':
      return '魔王討伐';
    case 'slayBandit':
      return '盗賊討伐';
    case 'dungeon':
      return 'ダンジョン探索';
    case 'escort':
      return '護衛';
    case 'delivery':
      return '宅配';
    case 'assassinate':
      return '暗殺';
  }
}

export function maybePostQuest(rng: Rng, state: GameState, city: City): void {
  if (city.quests.length >= 4) return;
  if (!rng.chance(0.05)) return;
  const type = rng.pick(QUEST_TYPES);
  let targetId: number | null = null;
  let reward = rng.int(100, 800);
  if (type === 'slayBoss' && state.bosses.length > 0) {
    targetId = rng.pick(state.bosses).charId;
    reward += 2000;
  } else if (type === 'slayBandit' && state.forts.length > 0) {
    const fort = rng.pick(state.forts);
    if (fort.members.length > 0) targetId = fort.members[0];
    reward += 500;
  }
  const q: Quest = {
    id: allocId(),
    type,
    cityId: city.id,
    targetId,
    reward,
    acceptedBy: null,
    done: false,
    description: describe(type),
  };
  city.quests.push(q);
}

export function tryAcceptQuest(rng: Rng, city: City, npc: Character): void {
  if (npc.kind !== 'npc') return;
  for (const q of city.quests) {
    if (q.acceptedBy === null && !q.done && rng.chance(0.3)) {
      q.acceptedBy = npc.id;
      npc.targetId = q.targetId;
      return;
    }
  }
}

export function checkQuestCompletion(state: GameState): void {
  for (const city of state.cities) {
    for (const q of city.quests) {
      if (q.done) continue;
      if (q.targetId !== null) {
        const target = state.characters.get(q.targetId);
        if (target && !target.alive && q.acceptedBy !== null) {
          completeQuest(state, city, q);
        }
      }
    }
    for (let i = city.quests.length - 1; i >= 0; i--) {
      if (city.quests[i].done) city.quests.splice(i, 1);
    }
  }
}

function completeQuest(state: GameState, city: City, q: Quest): void {
  q.done = true;
  if (q.acceptedBy === null) return;
  const npc = state.characters.get(q.acceptedBy);
  if (!npc) return;
  npc.inventory.money += q.reward;
  npc.stats.honor += 10;
  city.population += 5;
  state.addEvent(`${displayName(npc)} が${q.description}を達成 報酬${q.reward}`, COLOR_MONEY, [npc.id]);
  npc.history.push({ stamp: '', text: `${q.description}を達成し${q.reward}を得た` });
  city.events.push({ stamp: '', text: `${q.description}達成` });
  if (q.type === 'dungeon') {
    state.addEvent(`${displayName(npc)} が伝説の武具を発見`, COLOR_TREASURE, [npc.id]);
  }
}