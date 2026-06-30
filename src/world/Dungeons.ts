// 責務: ダンジョン・伝説武器の生成と管理(ボス再湧き・探索クリア判定)
import type { Rng } from '../core/Rng';
import { dist } from '../core/Vec2';
import type { Vec2 } from '../core/Vec2';
import { WORLD, DUNGEON, LEGEND } from '../config/constants';
import type { Dungeon, LegendWeapon } from '../domain/types';

export class DungeonSystem {
  readonly dungeons: Dungeon[] = [];
  readonly legends: Map<number, LegendWeapon> = new Map();
  private legendSeq = 0;

  constructor(rng: Rng) {
    for (let i = 0; i < DUNGEON.COUNT; i++) {
      const pos: Vec2 = {
        x: rng.range(WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
        y: rng.range(WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN)
      };
      const legendId = this.legendSeq++;
      const name = LEGEND.NAMES[legendId % LEGEND.NAMES.length];
      this.legends.set(legendId, {
        id: legendId,
        name,
        powerBonus: LEGEND.POWER_BONUS,
        magicBonus: LEGEND.MAGIC_BONUS,
        ownerId: -1
      });
      this.dungeons.push({
        id: i,
        name: `迷宮${i + 1}`,
        pos,
        bossId: -1,
        treasures: DUNGEON.TREASURE_PER_DUNGEON,
        legendId,
        bossDeadAt: -1,
        cleared: false
      });
    }
  }

  nearestDungeon(p: Vec2): Dungeon | null {
    let best: Dungeon | null = null;
    let bestD = Infinity;
    for (const d of this.dungeons) {
      const dd = dist(p, d.pos);
      if (dd < bestD) {
        bestD = dd;
        best = d;
      }
    }
    return best;
  }

  claimLegend(legendId: number, ownerId: number): LegendWeapon | null {
    const w = this.legends.get(legendId);
    if (!w || w.ownerId >= 0) return null;
    w.ownerId = ownerId;
    return w;
  }

  legendOf(id: number): LegendWeapon | undefined {
    return this.legends.get(id);
  }
}