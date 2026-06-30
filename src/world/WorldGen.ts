// 責務: ワールド(都市・村・道路・砦)の自動生成
import { Rng } from '../core/Rng';
import { dist } from '../core/Vec2';
import type { Vec2 } from '../core/Vec2';
import { WORLD, COUNTS } from '../config/constants';
import type { City, Village, Road, Fort } from '../domain/types';
import { genCityName, genVillageName } from '../domain/Names';

export interface GeneratedWorld {
  cities: City[];
  villages: Village[];
  roads: Road[];
  forts: Fort[];
}

function randPos(rng: Rng): Vec2 {
  return {
    x: rng.range(WORLD.EDGE_MARGIN, WORLD.WIDTH - WORLD.EDGE_MARGIN),
    y: rng.range(WORLD.EDGE_MARGIN, WORLD.HEIGHT - WORLD.EDGE_MARGIN)
  };
}

export function generateWorld(rng: Rng): GeneratedWorld {
  const cities: City[] = [];
  for (let i = 0; i < COUNTS.CITIES; i++) {
    let p = randPos(rng);
    let tries = 0;
    while (cities.some((c) => dist(c.pos, p) < 900) && tries < 40) {
      p = randPos(rng);
      tries++;
    }
    cities.push({
      id: i,
      name: genCityName(rng),
      pos: p,
      population: rng.int(20, 120),
      storedChildren: [],
      quests: [],
      events: []
    });
  }

  // 各都市を最近接2都市と結ぶ(道路)
  const roads: Road[] = [];
  const connected = new Set<string>();
  for (const c of cities) {
    const others = cities
      .filter((o) => o.id !== c.id)
      .sort((a, b) => dist(c.pos, a.pos) - dist(c.pos, b.pos))
      .slice(0, 2);
    for (const o of others) {
      const key = c.id < o.id ? `${c.id}-${o.id}` : `${o.id}-${c.id}`;
      if (connected.has(key)) continue;
      connected.add(key);
      roads.push({ a: c.pos, b: o.pos });
    }
  }

  // 村を道路上に点在
  const villages: Village[] = [];
  for (let i = 0; i < COUNTS.VILLAGES; i++) {
    const road = rng.pick(roads);
    const t = rng.range(0.2, 0.8);
    villages.push({
      id: i,
      name: genVillageName(rng, i),
      pos: {
        x: road.a.x + (road.b.x - road.a.x) * t + rng.range(-60, 60),
        y: road.a.y + (road.b.y - road.a.y) * t + rng.range(-60, 60)
      }
    });
  }

  // 砦をランダム配置(初期少数)
  const forts: Fort[] = [];
  const fortCount = 8;
  for (let i = 0; i < fortCount; i++) {
    forts.push({ id: i, pos: randPos(rng), members: [], alive: true });
  }

  return { cities, villages, roads, forts };
}

// 都市1+隣接2点で三角形を作り内部点を返す(リスポーン用)
export function triangleSpawn(rng: Rng, world: GeneratedWorld): Vec2 {
  const c = rng.pick(world.cities);
  const neighbors = [...world.cities.filter((o) => o.id !== c.id), ...world.villages]
    .map((o) => ({ pos: o.pos, d: dist(c.pos, o.pos) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  if (neighbors.length < 2) {
    return { x: c.pos.x, y: c.pos.y };
  }
  let u = rng.next();
  let v = rng.next();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const p0 = c.pos;
  const p1 = neighbors[0].pos;
  const p2 = neighbors[1].pos;
  return {
    x: p0.x + u * (p1.x - p0.x) + v * (p2.x - p0.x),
    y: p0.y + u * (p1.y - p0.y) + v * (p2.y - p0.y)
  };
}