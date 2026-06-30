// File: src/ai/Planner.ts
// 責務: GOAPプランナ。現在状態から目標を満たす最小コストのアクション列を探索する。

import { AgentState, GoapAction, Goal, satisfies, applyEffects } from './Goap';
import { ALL_ACTIONS, GOALS } from './Actions';

interface PlanNode {
  state: AgentState;
  action: GoapAction | null;
  parent: PlanNode | null;
  cost: number;
}

const MAX_DEPTH = 4;

export class Planner {
  public selectGoal(state: AgentState, desires: { isEvil: boolean }): Goal {
    const candidates = GOALS.filter((g) => !satisfies(state, g.desired));
    if (candidates.length === 0) {
      return GOALS[GOALS.length - 1];
    }
    if (desires.isEvil) {
      const earn = candidates.find((g) => g.name === 'earn');
      if (earn) {
        return earn;
      }
    }
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0];
  }

  public plan(state: AgentState, goal: Goal): GoapAction[] {
    if (satisfies(state, goal.desired)) {
      return [];
    }
    const open: PlanNode[] = [{ state, action: null, parent: null, cost: 0 }];
    let best: PlanNode | null = null;

    while (open.length > 0) {
      open.sort((a, b) => a.cost - b.cost);
      const node = open.shift();
      if (!node) {
        break;
      }
      if (satisfies(node.state, goal.desired)) {
        best = node;
        break;
      }
      const depth = this.depth(node);
      if (depth >= MAX_DEPTH) {
        continue;
      }
      for (const action of ALL_ACTIONS) {
        if (!satisfies(node.state, action.preconditions)) {
          continue;
        }
        const nextState = applyEffects(node.state, action.effects);
        open.push({
          state: nextState,
          action,
          parent: node,
          cost: node.cost + action.cost,
        });
      }
    }

    if (!best) {
      return [];
    }
    const seq: GoapAction[] = [];
    let cur: PlanNode | null = best;
    while (cur && cur.action) {
      seq.unshift(cur.action);
      cur = cur.parent;
    }
    return seq;
  }

  private depth(node: PlanNode): number {
    let d = 0;
    let cur: PlanNode | null = node;
    while (cur && cur.parent) {
      d++;
      cur = cur.parent;
    }
    return d;
  }
}