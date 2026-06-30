// 責務: 感情遭遇処理を全NPCに対し空間分割で実行
import { EMOTION } from '../config/constants2';
import { processEncounter, applyAccident } from './emotionSystem';
import type { EmotionEvent } from './emotionSystem';
import type { Character } from '../entities/character';
import type { SpatialGrid } from '../core/spatialGrid';
import type { Rng } from '../core/rng';

export class EmotionSystemRunner {
  run(charById: Map<number, Character>, grid: SpatialGrid, rng: Rng): EmotionEvent[] {
    const events: EmotionEvent[] = [];
    const npcs = [...charById.values()].filter((c) => c.kind === 'npc' && c.alive);
    for (const a of npcs) {
      const near = grid.queryRadius(a.pos, EMOTION.ENCOUNTER_RANGE);
      for (const id of near) {
        if (id <= a.id) continue;
        const b = charById.get(id);
        if (!b || b.kind !== 'npc' || !b.alive) continue;
        if (rng.chance(0.02)) {
          events.push(applyAccident(a, b));
        } else {
          const ev = processEncounter(a, b);
          if (ev) events.push(ev);
        }
      }
    }
    return events;
  }
}