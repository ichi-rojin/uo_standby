// 責務: ワールド自動生成(都市/補給拠点/道路/初期キャラ配置)
import { WORLD, COUNTS, ENTITY } from '../config/constants';
import { Rng } from '../core/rng';
import { Place } from '../entities/place';
import { Character } from '../entities/character';
import { genName, genTitle } from '../core/nameGen';
import type { Vec2, Gender, WeaponType, CharacterKind } from '../domain/types';

const CITY_NAMES = ['ブリタニア', 'トリンシック', 'ミノック', 'ヴェスパー', 'ユー', 'マジンシア', 'スカラ', 'デルシア', 'コーヴ', 'セレス', 'ノクス', 'パピュア', 'ジェロム', 'レイクサイド', 'オクロ', 'ウィンド', 'セレナ', 'モントル', 'ガレス', 'リオン'];
const WEAPONS: WeaponType[] = ['sword', 'pole', 'bow', 'magic'];

export interface Road {
  a: Vec2;
  b: Vec2;
}

export interface WorldData {
  cities: Place[];
  supplies: Place[];
  roads: Road[];
  characters: Character[];
}

function margin(rng: Rng, axis: number): number {
  const m = axis * 0.12;
  return rng.range(m, axis - m);
}

export class WorldGenerator {
  private rng: Rng;
  private nextId: number;

  constructor(seed: number) {
    this.rng = new Rng(seed);
    this.nextId = 0;
  }

  private id(): number {
    return this.nextId++;
  }

  generate(): WorldData {
    const cities = this.makeCities();
    const supplies = this.makeSupplies(cities);
    const roads = this.makeRoads(cities, supplies);
    const characters = this.makeNpcs(cities, supplies);
    return { cities, supplies, roads, characters };
  }

  nextEntityId(): number {
    return this.nextId;
  }

  bumpId(v: number): void {
    this.nextId = v;
  }

  getRng(): Rng {
    return this.rng;
  }

  private makeCities(): Place[] {
    const cities: Place[] = [];
    for (let i = 0; i < COUNTS.CITY; i++) {
      const pos: Vec2 = { x: margin(this.rng, WORLD.WIDTH), y: margin(this.rng, WORLD.HEIGHT) };
      cities.push(new Place(this.id(), 'city', CITY_NAMES[i % CITY_NAMES.length], pos));
    }
    return cities;
  }

  private makeSupplies(cities: Place[]): Place[] {
    const supplies: Place[] = [];
    for (let i = 0; i < COUNTS.SUPPLY; i++) {
      const ca = this.rng.pick(cities);
      const cb = this.rng.pick(cities);
      const t = this.rng.next();
      const jitter = 200;
      const pos: Vec2 = {
        x: ca.pos.x + (cb.pos.x - ca.pos.x) * t + this.rng.range(-jitter, jitter),
        y: ca.pos.y + (cb.pos.y - ca.pos.y) * t + this.rng.range(-jitter, jitter)
      };
      pos.x = Math.max(50, Math.min(WORLD.WIDTH - 50, pos.x));
      pos.y = Math.max(50, Math.min(WORLD.HEIGHT - 50, pos.y));
      supplies.push(new Place(this.id(), 'supply', `村${i + 1}`, pos));
    }
    return supplies;
  }

  private makeRoads(cities: Place[], supplies: Place[]): Road[] {
    const roads: Road[] = [];
    for (let i = 0; i < cities.length; i++) {
      let best = -1;
      let bestD = Infinity;
      for (let j = 0; j < cities.length; j++) {
        if (i === j) continue;
        const dx = cities[i].pos.x - cities[j].pos.x;
        const dy = cities[i].pos.y - cities[j].pos.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = j; }
      }
      if (best >= 0) roads.push({ a: cities[i].pos, b: cities[best].pos });
    }
    for (const s of supplies) {
      let best = -1;
      let bestD = Infinity;
      for (let j = 0; j < cities.length; j++) {
        const dx = s.pos.x - cities[j].pos.x;
        const dy = s.pos.y - cities[j].pos.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = j; }
      }
      if (best >= 0) roads.push({ a: s.pos, b: cities[best].pos });
    }
    return roads;
  }

  spawnPoint(cities: Place[], supplies: Place[]): Vec2 {
    const c = this.rng.pick(cities);
    const pool = [...supplies, ...cities].filter((p) => p.id !== c.id);
    const p1 = this.rng.pick(pool);
    const p2 = this.rng.pick(pool.filter((p) => p.id !== p1.id));
    let r1 = this.rng.next();
    let r2 = this.rng.next();
    if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const x = c.pos.x + r1 * (p1.pos.x - c.pos.x) + r2 * (p2.pos.x - c.pos.x);
    const y = c.pos.y + r1 * (p1.pos.y - c.pos.y) + r2 * (p2.pos.y - c.pos.y);
    const mx = WORLD.WIDTH * 0.06;
    const my = WORLD.HEIGHT * 0.06;
    return {
      x: Math.max(mx, Math.min(WORLD.WIDTH - mx, x)),
      y: Math.max(my, Math.min(WORLD.HEIGHT - my, y))
    };
  }

  private makeNpcs(cities: Place[], supplies: Place[]): Character[] {
    const list: Character[] = [];
    for (let i = 0; i < COUNTS.NPC; i++) {
      const gender: Gender = this.rng.chance(0.5) ? 'male' : 'female';
      const c = this.makeCharacter('npc', gender, cities, supplies);
      list.push(c);
    }
    return list;
  }

  makeCharacter(kind: CharacterKind, gender: Gender, cities: Place[], supplies: Place[]): Character {
    const c = new Character(this.id(), kind, gender);
    const nm = genName(this.rng, gender);
    c.surname = nm.sur;
    c.givenName = nm.given;
    c.inv.weapon = this.rng.pick(WEAPONS);
    c.ab.maxHp = this.rng.int(60, 140);
    c.ab.hp = c.ab.maxHp;
    c.ab.maxMp = this.rng.int(20, 90);
    c.ab.mp = c.ab.maxMp;
    c.ab.power = this.rng.int(5, 25);
    c.ab.agility = this.rng.int(5, 25);
    c.ab.reaction = this.rng.int(5, 25);
    c.ab.perception = this.rng.int(5, 25);
    c.ab.dexterity = this.rng.int(5, 25);
    c.ab.magic = this.rng.int(5, 25);
    c.ab.moral = this.rng.int(-10, 10);
    c.ab.honor = this.rng.int(0, 40);
    c.skills.swordSkill = this.rng.int(0, 50);
    c.skills.bowSkill = this.rng.int(0, 50);
    c.skills.magicAttack = this.rng.int(0, 50);
    c.skills.magicHeal = this.rng.int(0, 50);
    c.skills.mapKnowledge = this.rng.int(0, 50);
    c.cityAttachment = this.rng.next();
    c.hueSeed = this.rng.next();
    c.isBandit = c.ab.moral <= -6;
    c.title = genTitle(c.ab.moral, c.ab.honor, c.inv.weapon);
    const home = this.rng.pick(cities);
    c.homeCityId = home.id;
    if (kind === 'npc') {
      c.pos = this.spawnPoint(cities, supplies);
    }
    return c;
  }

  makeMonster(cities: Place[], supplies: Place[]): Character {
    const c = new Character(this.id(), 'monster', this.rng.chance(0.5) ? 'male' : 'female');
    c.surname = 'モンスター';
    c.givenName = `#${c.id}`;
    c.title = '野獣';
    c.inv.weapon = 'sword';
    c.ab.maxHp = this.rng.int(30, 120);
    c.ab.hp = c.ab.maxHp;
    c.ab.maxMp = this.rng.int(0, 40);
    c.ab.mp = c.ab.maxMp;
    c.ab.power = this.rng.int(4, 30);
    c.ab.agility = this.rng.int(3, 20);
    c.ab.reaction = this.rng.int(3, 20);
    c.ab.perception = this.rng.int(5, 30);
    c.ab.dexterity = this.rng.int(3, 20);
    c.ab.magic = this.rng.int(0, 20);
    c.ab.moral = -10;
    c.hueSeed = this.rng.next();
    c.pos = this.spawnPoint(cities, supplies);
    c.goal = 'wander';
    return c;
  }
}

export const ENTITY_REF = ENTITY;