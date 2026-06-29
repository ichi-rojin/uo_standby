// 責務: 死亡キャラのグレースケール表示時間経過後の除去判定。

import { DEATH } from '../config/GameConfig';
import { World } from '../world/World';

export class DeathSystem {
  /** @returns 除去されたキャラクターIDの配列 */
  update(world: World, totalMinutes: number): number[] {
    const removed: number[] = [];
    for (let i = world.characters.length - 1; i >= 0; i--) {
      const c = world.characters[i];
      if (c.alive) {
        continue;
      }
      if (totalMinutes - c.deathMinute >= DEATH.GRAYSCALE_MINUTES) {
        removed.push(c.id);
        world.characters.splice(i, 1);
      }
    }
    return removed;
  }
}