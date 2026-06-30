// File: src/ai/Actions.ts
// 責務: GOAPで使用する具体的アクション定義の集合。狩り・交易・休息・社交・略奪・徘徊。

import { GoapAction, Goal } from './Goap';
import { ActionCost } from '../config/BehaviorConfig';

export enum ActionName {
  Hunt = 'hunt',
  Trade = 'trade',
  Rest = 'rest',
  Socialize = 'socialize',
  Rob = 'rob',
  Wander = 'wander',
}

export const ALL_ACTIONS: readonly GoapAction[] = [
  {
    name: ActionName.Hunt,
    cost: ActionCost.HUNT,
    preconditions: { nearEnemy: true },
    effects: { hasFood: true, hasMoney: true, hasValuables: true },
  },
  {
    name: ActionName.Trade,
    cost: ActionCost.TRADE,
    preconditions: { nearCity: true, hasValuables: true },
    effects: { hasMoney: true, hasValuables: false },
  },
  {
    name: ActionName.Rest,
    cost: ActionCost.REST,
    preconditions: { nearCity: true },
    effects: { lowHp: false, lowHealth: false },
  },
  {
    name: ActionName.Socialize,
    cost: ActionCost.SOCIALIZE,
    preconditions: { nearAlly: true },
    effects: {},
  },
  {
    name: ActionName.Rob,
    cost: ActionCost.ROB,
    preconditions: { isEvil: true, nearTarget: true },
    effects: { hasMoney: true },
  },
  {
    name: ActionName.Wander,
    cost: ActionCost.WANDER,
    preconditions: {},
    effects: { nearEnemy: true, nearCity: true, nearAlly: true, nearTarget: true },
  },
];

export const GOALS: readonly Goal[] = [
  { name: 'survive_hp', desired: { lowHp: false }, priority: 100 },
  { name: 'survive_health', desired: { lowHealth: false }, priority: 90 },
  { name: 'eat', desired: { hasFood: true }, priority: 80 },
  { name: 'earn', desired: { hasMoney: true }, priority: 50 },
  { name: 'grow', desired: { hasValuables: true }, priority: 30 },
];