// 責務: NPC交配判定・子の都市格納・世代昇格(10年後NPC化)
import { REPRO } from '../config/constants2';
import { Rng } from '../core/rng';
import { genName, genTitle } from '../core/nameGen';
import { Character } from '../entities/character';
import type { Place } from '../entities/place';
import type { Gender, WeaponType } from '../domain/types';

export interface ChildRecord {
  bornTick: number;
  cityId: number;
  gender: Gender;
  fatherId: number;
  motherId: number;
  inheritedPower: number;
  inheritedMagic: number;
}

const WEAPONS: WeaponType[] = ['sword', 'pole', 'bow', 'magic'];

export class ReproductionSystem {
  private children: ChildRecord[] = [];
  private mateCooldown = new Map<number, number>();

  canMate(a: Character, tick: number): boolean {
    if (a.kind !== 'npc' || !a.alive) return false;
    if (a.needs.lust < REPRO.LUST_THRESHOLD) return false;
    const cd = this.mateCooldown.get(a.id) ?? -Infinity;
    return tick - cd >= REPRO.COOLDOWN_TICKS;
  }

  tryMate(a: Character, b: Character, tick: number, rng: Rng): ChildRecord | null {
    if (a.gender === b.gender) return null;
    if (!this.canMate(a, tick) || !this.canMate(b, tick)) return null;
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    if (dx * dx + dy * dy > REPRO.MATE_RANGE * REPRO.MATE_RANGE) return null;
    this.mateCooldown.set(a.id, tick);
    this.mateCooldown.set(b.id, tick);
    a.needs.lust = 0;
    b.needs.lust = 0;
    a.addHistory(tick, `${b.fullName()}と交配した`);
    b.addHistory(tick, `${a.fullName()}と交配した`);
    if (!rng.chance(REPRO.CHILD_CHANCE)) return null;
    const child: ChildRecord = {
      bornTick: tick,
      cityId: a.homeCityId,
      gender: rng.chance(0.5) ? 'male' : 'female',
      fatherId: a.gender === 'male' ? a.id : b.id,
      motherId: a.gender === 'female' ? a.id : b.id,
      inheritedPower: Math.floor((a.ab.power + b.ab.power) / 2),
      inheritedMagic: Math.floor((a.ab.magic + b.ab.magic) / 2)
    };
    this.children.push(child);
    return child;
  }

  promoteMature(tick: number, cities: Place[], rng: Rng, nextId: () => number): Character[] {
    const grown: Character[] = [];
    const remain: ChildRecord[] = [];
    for (const ch of this.children) {
      if (tick - ch.bornTick >= REPRO.MATURE_TICKS) {
        const c = this.makeAdult(ch, cities, rng, nextId());
        if (c) grown.push(c);
      } else {
        remain.push(ch);
      }
    }
    this.children = remain;
    return grown;
  }

  pendingForCity(cityId: number): number {
    return this.children.filter((c) => c.cityId === cityId).length;
  }

  private makeAdult(ch: ChildRecord, cities: Place[], rng: Rng, id: number): Character | null {
    const c = new Character(id, 'npc', ch.gender);
    const nm = genName(rng, ch.gender);
    c.surname = nm.sur;
    c.givenName = nm.given;
    c.inv.weapon = rng.pick(WEAPONS);
    c.ab.maxHp = rng.int(60, 140);
    c.ab.hp = c.ab.maxHp;
    c.ab.maxMp = rng.int(20, 90);
    c.ab.mp = c.ab.maxMp;
    c.ab.power = ch.inheritedPower + rng.int(-3, 5);
    c.ab.magic = ch.inheritedMagic + rng.int(-3, 5);
    c.ab.agility = rng.int(5, 25);
    c.ab.reaction = rng.int(5, 25);
    c.ab.perception = rng.int(5, 25);
    c.ab.dexterity = rng.int(5, 25);
    c.ab.moral = rng.int(-10, 10);
    c.ab.honor = rng.int(0, 20);
    c.cityAttachment = rng.next();
    c.hueSeed = rng.next();
    c.homeCityId = ch.cityId;
    c.isBandit = c.ab.moral <= -6;
    c.title = genTitle(c.ab.moral, c.ab.honor, c.inv.weapon);
    const home = cities.find((p) => p.id === ch.cityId) ?? cities[0];
    c.pos = { x: home.pos.x + rng.range(-40, 40), y: home.pos.y + rng.range(-40, 40) };
    return c;
  }
}