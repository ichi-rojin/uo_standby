// 責務: GOAP(ゴール指向プランニング)。世界状態から最適ゴールを選定しアクション列を返す
import { GOAP } from '../config/constants';
import type { Character } from '../domain/types';

export type GoapGoal =
  | 'survive'
  | 'eat'
  | 'sleep'
  | 'mate'
  | 'earnMoney'
  | 'gainFame'
  | 'hunt'
  | 'banditRaid'
  | 'wander';

export type GoapAction =
  | 'gotoCity'
  | 'gotoVillage'
  | 'gotoFort'
  | 'restAtRefuge'
  | 'buyFood'
  | 'seekMate'
  | 'seekPrey'
  | 'seekVictim'
  | 'sellTreasure'
  | 'roam';

export interface GoapPlan {
  goal: GoapGoal;
  actions: GoapAction[];
}

interface ScoredGoal {
  goal: GoapGoal;
  score: number;
}

// 各ゴールの効用を需要から算出(単一責任の評価関数群)
function scoreSurvive(c: Character): number {
  const hpRatio = c.stats.hp / c.stats.maxHp;
  if (hpRatio < GOAP.HP_LOW_RATIO) return 100 * (1 - hpRatio);
  return 0;
}
function scoreEat(c: Character): number {
  if (c.inventory.food <= 0) return c.needs.hunger + 20;
  return c.needs.hunger >= GOAP.HUNGER_URGENT ? c.needs.hunger : 0;
}
function scoreSleep(c: Character): number {
  return c.needs.sleep >= GOAP.SLEEP_URGENT ? c.needs.sleep : 0;
}
function scoreMate(c: Character): number {
  return c.needs.lust >= GOAP.LUST_URGENT ? c.needs.lust : 0;
}
function scoreMoney(c: Character): number {
  if (c.inventory.gold < GOAP.MONEY_DESIRE) return c.needs.money + (GOAP.MONEY_DESIRE - c.inventory.gold) * 0.1;
  return c.needs.money;
}
function scoreFame(c: Character): number {
  return c.needs.fame >= GOAP.FAME_DESIRE ? c.needs.fame * 0.5 : c.needs.fame * 0.2;
}
function scoreHunt(c: Character): number {
  return 15 + c.needs.growth * 0.3;
}
function scoreRaid(c: Character): number {
  if (!c.evil) return 0;
  return 40 + (GOAP.MONEY_DESIRE - c.inventory.gold) * 0.2;
}

function actionsFor(goal: GoapGoal, c: Character): GoapAction[] {
  switch (goal) {
    case 'survive':
      return c.evil ? ['gotoFort', 'restAtRefuge'] : ['gotoCity', 'restAtRefuge'];
    case 'eat':
      return c.inventory.gold > 0 ? ['gotoCity', 'buyFood'] : ['gotoVillage', 'buyFood'];
    case 'sleep':
      return c.evil ? ['gotoFort', 'restAtRefuge'] : ['gotoCity', 'restAtRefuge'];
    case 'mate':
      return ['gotoCity', 'seekMate'];
    case 'earnMoney':
      return c.inventory.treasures > 0 ? ['gotoCity', 'sellTreasure'] : ['seekPrey'];
    case 'gainFame':
      return ['seekPrey'];
    case 'hunt':
      return ['seekPrey'];
    case 'banditRaid':
      return ['seekVictim'];
    case 'wander':
    default:
      return ['roam'];
  }
}

export function plan(c: Character): GoapPlan {
  const candidates: ScoredGoal[] = [
    { goal: 'survive', score: scoreSurvive(c) },
    { goal: 'eat', score: scoreEat(c) },
    { goal: 'sleep', score: scoreSleep(c) },
    { goal: 'mate', score: scoreMate(c) },
    { goal: 'earnMoney', score: scoreMoney(c) },
    { goal: 'gainFame', score: scoreFame(c) },
    { goal: 'hunt', score: scoreHunt(c) },
    { goal: 'banditRaid', score: scoreRaid(c) }
  ];
  let best: ScoredGoal = { goal: 'wander', score: 5 };
  for (const cand of candidates) {
    if (cand.score > best.score) best = cand;
  }
  return { goal: best.goal, actions: actionsFor(best.goal, c) };
}