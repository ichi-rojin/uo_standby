// File: src/world/WorldGenerator.ts
// 責務: ワールドの自動生成。都市・補給拠点・道路網・初期キャラクターを配置する。

import { RNG } from '../core/RNG';
import {
  WorldConfig,
  PopulationConfig,
  StatsConfig,
  MonsterConfig,
} from '../config/GameConfig';
import { City } from '../entities/City';
import { Supply } from '../entities/Supply';
import { Road } from '../entities/Road';
import { Character } from '../entities/Character';
import { Gender, EntityKind, WeaponType } from '../domain/types';
import {
  rollAttributes,
  rollSkills,
  rollInventory,
  rollDesires,
  computePower,
  pickWeapon,
} from '../domain/Stats';
import { generateName, generateTitle } from '../domain/Names';
import { lerpColor } from '../render/ProceduralDraw';
import { ColorConfig } from '../config/GameConfig';

const CITY_PREFIX: readonly string[] = [
  'リオ', 'ヴェル', 'カス', 'ドゥル', 'エフ', 'ガラ', 'ハーン', 'ミネ',
  'ソル', 'ターニ', 'ウェス', 'ノヴァ', 'パロ', 'クレス', 'ロンデ', 'セレ',
  'トリア', 'ウーノ', 'ヴィント', 'ザール',
];
const CITY_SUFFIX: readonly string[] = ['市', 'タウン', '都', '城下', '港'];

export interface GeneratedWorld {
  cities: City[];
  supplies: Supply[];
  roads: Road[];
  characters: Character[];
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export class WorldGenerator {
  constructor(private readonly rng: RNG) {}

  public generate(): GeneratedWorld {
    const cities = this.generateCities();
    const supplies = this.generateSupplies(cities);
    const roads = this.generateRoads(cities, supplies);
    const characters = this.generateInitialCharacters(cities, supplies);
    return { cities, supplies, roads, characters };
  }

  private randInBounds(): { x: number; y: number } {
    const m = WorldConfig.EDGE_MARGIN;
    return {
      x: this.rng.range(m, WorldConfig.WIDTH - m),
      y: this.rng.range(m, WorldConfig.HEIGHT - m),
    };
  }

  private generateCities(): City[] {
    const cities: City[] = [];
    const minSep = 700;
    let attempts = 0;
    while (cities.length < PopulationConfig.CITY_COUNT && attempts < 5000) {
      attempts++;
      const p = this.randInBounds();
      let ok = true;
      for (const c of cities) {
        if (dist2(p.x, p.y, c.x, c.y) < minSep * minSep) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        continue;
      }
      const name = `${this.rng.pick(CITY_PREFIX)}${this.rng.pick(CITY_SUFFIX)}`;
      const pop = this.rng.int(200, 2000);
      cities.push(new City(p.x, p.y, name, pop));
    }
    return cities;
  }

  private generateSupplies(cities: City[]): Supply[] {
    const supplies: Supply[] = [];
    for (let i = 0; i < PopulationConfig.SUPPLY_COUNT; i++) {
      const a = this.rng.pick(cities);
      const b = this.rng.pick(cities);
      const t = this.rng.range(0.2, 0.8);
      const jitter = 200;
      const x = a.x + (b.x - a.x) * t + this.rng.range(-jitter, jitter);
      const y = a.y + (b.y - a.y) * t + this.rng.range(-jitter, jitter);
      const cx = Math.max(WorldConfig.EDGE_MARGIN, Math.min(WorldConfig.WIDTH - WorldConfig.EDGE_MARGIN, x));
      const cy = Math.max(WorldConfig.EDGE_MARGIN, Math.min(WorldConfig.HEIGHT - WorldConfig.EDGE_MARGIN, y));
      supplies.push(new Supply(cx, cy, `村${i + 1}`));
    }
    return supplies;
  }

  private generateRoads(cities: City[], supplies: Supply[]): Road[] {
    const roads: Road[] = [];
    // 各都市を最近傍2都市と結ぶ
    for (let i = 0; i < cities.length; i++) {
      const a = cities[i];
      const sorted = cities
        .filter((_, j) => j !== i)
        .map((c) => ({ c, d: dist2(a.x, a.y, c.x, c.y) }))
        .sort((p, q) => p.d - q.d);
      for (let k = 0; k < Math.min(2, sorted.length); k++) {
        const b = sorted[k].c;
        roads.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
      }
    }
    // 各補給拠点を最近傍都市と結ぶ
    for (const s of supplies) {
      let best: City | null = null;
      let bestD = Infinity;
      for (const c of cities) {
        const d = dist2(s.x, s.y, c.x, c.y);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (best) {
        roads.push({ ax: s.x, ay: s.y, bx: best.x, by: best.y });
      }
    }
    return roads;
  }

  private spawnTriangle(cities: City[], supplies: Supply[]): { x: number; y: number } {
    const city = this.rng.pick(cities);
    const nodes: { x: number; y: number }[] = [
      ...cities.filter((c) => c.id !== city.id).map((c) => ({ x: c.x, y: c.y })),
      ...supplies.map((s) => ({ x: s.x, y: s.y })),
    ];
    nodes.sort(
      (a, b) =>
        dist2(a.x, a.y, city.x, city.y) - dist2(b.x, b.y, city.x, city.y),
    );
    const n1 = nodes[0];
    const n2 = nodes[1] ?? nodes[0];
    let u = this.rng.next();
    let v = this.rng.next();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const x = city.x + u * (n1.x - city.x) + v * (n2.x - city.x);
    const y = city.y + u * (n1.y - city.y) + v * (n2.y - city.y);
    const m = WorldConfig.EDGE_MARGIN;
    return {
      x: Math.max(m, Math.min(WorldConfig.WIDTH - m, x)),
      y: Math.max(m, Math.min(WorldConfig.HEIGHT - m, y)),
    };
  }

  public createNpc(cities: City[], supplies: Supply[]): Character {
    const pos = this.spawnTriangle(cities, supplies);
    const gender = this.rng.chance(0.5) ? Gender.Male : Gender.Female;
    const name = generateName(this.rng, gender);
    const weapon: WeaponType = pickWeapon(this.rng);
    const attributes = rollAttributes(this.rng);
    const skills = rollSkills(this.rng);
    const isEvil = this.rng.chance(0.15);
    return new Character({
      kind: EntityKind.Npc,
      gender,
      family: name.family,
      given: name.given,
      title: generateTitle(this.rng),
      hpMax: this.rng.int(StatsConfig.HP_MIN, StatsConfig.HP_MAX),
      mpMax: this.rng.int(StatsConfig.MP_MIN, StatsConfig.MP_MAX),
      attributes,
      skills,
      inventory: rollInventory(this.rng, weapon),
      desires: rollDesires(this.rng),
      isEvil,
      belonging: this.rng.range(0, 1),
      monsterTint: 0,
      x: pos.x,
      y: pos.y,
    });
  }

  public createMonster(): Character {
    const pos = this.randInBounds();
    const attributes = rollAttributes(this.rng);
    const skills = rollSkills(this.rng);
    const power = computePower(attributes, skills);
    const maxPower =
      StatsConfig.ATTR_MAX * 6 + StatsConfig.SKILL_MAX * 6 * 0.5;
    const ratio = Math.min(1, power / maxPower);
    const tint = lerpColor(
      ColorConfig.MONSTER_BASE_WEAK,
      ColorConfig.MONSTER_BASE_STRONG,
      ratio,
    );
    return new Character({
      kind: EntityKind.Monster,
      gender: this.rng.chance(0.5) ? Gender.Male : Gender.Female,
      family: '魔',
      given: '物',
      title: '',
      hpMax: this.rng.int(StatsConfig.HP_MIN, StatsConfig.HP_MAX),
      mpMax: this.rng.int(0, StatsConfig.MP_MIN),
      attributes,
      skills,
      inventory: rollInventory(this.rng, WeaponType.Sword),
      desires: rollDesires(this.rng),
      isEvil: ratio > MonsterConfig.STRONG_THRESHOLD,
      belonging: 0,
      monsterTint: tint,
      x: pos.x,
      y: pos.y,
    });
  }

  private generateInitialCharacters(cities: City[], supplies: Supply[]): Character[] {
    const chars: Character[] = [];
    for (let i = 0; i < PopulationConfig.NPC_COUNT; i++) {
      chars.push(this.createNpc(cities, supplies));
    }
    for (let i = 0; i < PopulationConfig.MONSTER_MIN; i++) {
      chars.push(this.createMonster());
    }
    return chars;
  }
}