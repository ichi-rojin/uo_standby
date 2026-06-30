// 責務: 夜盗の砦建設・配下リクルート・空砦の朽ち消滅
import { FORT } from '../config/constants2';
import { Fort } from '../entities/fort';
import type { Character } from '../entities/character';
import type { Vec2 } from '../domain/types';

export interface FortEvent {
  text: string;
  charIds: number[];
}

export class FortSystem {
  forts: Fort[] = [];
  private fortByMember = new Map<number, number>();
  private nextName = 1;

  constructor(private nextId: () => number) {}

  maybeBuild(c: Character, tick: number): FortEvent | null {
    if (!c.isBandit || !c.alive) return null;
    if (this.fortByMember.has(c.id)) return null;
    if (c.needs.greed < FORT.BUILD_GREED) return null;
    const pos: Vec2 = { x: c.pos.x, y: c.pos.y };
    const fort = new Fort(this.nextId(), `砦${this.nextName++}`, pos);
    fort.members.add(c.id);
    this.fortByMember.set(c.id, fort.id);
    this.forts.push(fort);
    c.addHistory(tick, `${fort.name}を築いた`);
    return { text: `${c.fullName()}が${fort.name}を築いた。`, charIds: [c.id] };
  }

  recruit(leader: Character, target: Character, tick: number): FortEvent | null {
    const fortId = this.fortByMember.get(leader.id);
    if (fortId === undefined) return null;
    if (!target.isBandit || this.fortByMember.has(target.id)) return null;
    if (target.ab.power >= leader.ab.power) return null;
    const dx = leader.pos.x - target.pos.x;
    const dy = leader.pos.y - target.pos.y;
    if (dx * dx + dy * dy > FORT.RECRUIT_RANGE * FORT.RECRUIT_RANGE) return null;
    const fort = this.forts.find((f) => f.id === fortId);
    if (!fort) return null;
    fort.members.add(target.id);
    this.fortByMember.set(target.id, fortId);
    target.addHistory(tick, `${fort.name}の配下になった`);
    return { text: `${target.fullName()}が${fort.name}の配下になった。`, charIds: [leader.id, target.id] };
  }

  onMemberDeath(id: number): void {
    const fortId = this.fortByMember.get(id);
    if (fortId === undefined) return;
    const fort = this.forts.find((f) => f.id === fortId);
    if (fort) fort.members.delete(id);
    this.fortByMember.delete(id);
  }

  fortHome(c: Character): Fort | null {
    const fortId = this.fortByMember.get(c.id);
    if (fortId === undefined) return null;
    return this.forts.find((f) => f.id === fortId) ?? null;
  }

  decayEmpty(tick: number): FortEvent[] {
    const events: FortEvent[] = [];
    const remain: Fort[] = [];
    for (const f of this.forts) {
      if (f.isEmpty()) {
        f.decayed = true;
        events.push({ text: `${f.name}は朽ちて消滅した。`, charIds: [] });
        void tick;
      } else {
        remain.push(f);
      }
    }
    this.forts = remain;
    return events;
  }
}