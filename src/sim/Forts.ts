// 責務: 砦の生成・夜盗リクルート・討伐による朽ち・消滅判定
import type { Rng } from '../core/Rng';
import { dist } from '../core/Vec2';
import type { Vec2 } from '../core/Vec2';
import { FORT, WORLD } from '../config/constants';
import type { Character, Fort } from '../domain/types';

export class FortSystem {
  private seq: number;
  constructor(private forts: Fort[], rng: Rng) {
    this.seq = forts.length;
    void rng;
  }

  list(): readonly Fort[] {
    return this.forts;
  }

  createFort(pos: Vec2, founder: Character): Fort {
    const f: Fort = { id: this.seq++, pos: { x: pos.x, y: pos.y }, members: [founder.id], alive: true };
    this.forts.push(f);
    return f;
  }

  nearestFort(p: Vec2): Fort | null {
    let best: Fort | null = null;
    let bestD = Infinity;
    for (const f of this.forts) {
      if (!f.alive) continue;
      const d = dist(p, f.pos);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  recruit(fort: Fort, member: Character): boolean {
    if (fort.members.length >= FORT.MAX_MEMBERS) return false;
    if (fort.members.includes(member.id)) return false;
    if (dist(fort.pos, member.pos) > FORT.RECRUIT_RANGE) return false;
    fort.members.push(member.id);
    return true;
  }

  // メンバーが死亡/離脱したら配列を更新し、空なら朽ちて消滅
  refresh(isAlive: (id: number) => boolean): { decayed: Fort[] } {
    const decayed: Fort[] = [];
    for (const f of this.forts) {
      if (!f.alive) continue;
      f.members = f.members.filter((id) => isAlive(id));
      if (f.members.length === 0) {
        f.alive = false;
        decayed.push(f);
      }
    }
    return { decayed };
  }

  clampWorld(p: Vec2): Vec2 {
    return {
      x: Math.max(WORLD.EDGE_MARGIN, Math.min(WORLD.WIDTH - WORLD.EDGE_MARGIN, p.x)),
      y: Math.max(WORLD.EDGE_MARGIN, Math.min(WORLD.HEIGHT - WORLD.EDGE_MARGIN, p.y))
    };
  }
}