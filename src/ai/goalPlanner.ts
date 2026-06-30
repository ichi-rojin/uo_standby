// 責務: ゴールベースプランニング（欲求/性格からNPC/モンスターの目標決定）
import { NEED, FLEE, MORAL } from '../config/constants';
import type { Character, GoalType } from '../domain/types';

export function planGoal(c: Character): GoalType {
  if (c.captive.followingLeader !== null) return 'follow';

  const hpRatio = c.stats.hp / c.stats.hpMax;
  const fleeThreshold = FLEE.HP_RATIO_BASE * (1 + (1 - c.personality.courage));
  if (c.fleeing || hpRatio < fleeThreshold) {
    if (c.kind !== 'boss') return 'flee';
  }

  if (c.kind === 'monster') {
    return c.personality.aggression > 0.5 ? 'hunt' : 'wander';
  }

  if (c.kind === 'boss') return 'idle';

  if (c.stats.hp < c.stats.hpMax * 0.5 || c.stats.health < NEED.THRESHOLD_LOW) {
    return 'restCity';
  }
  if (c.needs.food < NEED.THRESHOLD_LOW) return 'eat';
  if (c.needs.sleep < NEED.THRESHOLD_LOW) return 'sleep';

  if (c.kind === 'bandit') {
    return c.stats.moral <= MORAL.EVIL_THRESHOLD ? 'rob' : 'wander';
  }

  if (c.needs.libido > NEED.THRESHOLD_HIGH && c.personality.lust > 0.5) return 'mate';
  if (c.inventory.money < 50 && c.personality.greed > 0.4) return 'gainMoney';
  if (c.personality.ambition > 0.6) return 'hunt';
  if (c.personality.wanderlust > 0.6) return 'wander';
  return c.personality.sociability > 0.5 ? 'restCity' : 'hunt';
}