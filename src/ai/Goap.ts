// File: src/ai/Goap.ts
// 責務: GOAP（ゴール指向行動計画）の型定義。ワールド状態・前提条件・効果を表現する。

export interface AgentState {
  hasFood: boolean;
  lowHp: boolean;
  lowHealth: boolean;
  hasMoney: boolean;
  hasValuables: boolean;
  nearEnemy: boolean;
  nearCity: boolean;
  nearAlly: boolean;
  nearTarget: boolean;
  isEvil: boolean;
}

export interface GoapAction {
  name: string;
  cost: number;
  preconditions: Partial<AgentState>;
  effects: Partial<AgentState>;
}

export interface Goal {
  name: string;
  desired: Partial<AgentState>;
  priority: number;
}

export function satisfies(state: AgentState, cond: Partial<AgentState>): boolean {
  for (const key of Object.keys(cond) as (keyof AgentState)[]) {
    if (state[key] !== cond[key]) {
      return false;
    }
  }
  return true;
}

export function applyEffects(state: AgentState, effects: Partial<AgentState>): AgentState {
  const next: AgentState = { ...state };
  for (const key of Object.keys(effects) as (keyof AgentState)[]) {
    const v = effects[key];
    if (v !== undefined) {
      next[key] = v;
    }
  }
  return next;
}