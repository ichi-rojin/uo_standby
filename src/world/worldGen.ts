// 責務: ワールド自動生成（都市・村・道路・ダンジョン・ボス・砦配置）
import { Rng } from '../util/rng';
import { dist2 } from '../util/math';
import { genCityName, genVillageName } from '../util/names';
import { COUNTS, WORLD } from '../config/constants';
import { allocId, createCharacter } from '../factory/characterFactory';
import type {
  Boss,
  Character,
  City,
  Dungeon,
  Fort,
  Road,
  Village,
} from '../domain/types';

export type WorldData = {
  cities: City[];
  villages: Village[];
  roads: Road[];
  dungeons: Dungeon[];
  bosses: Boss[];
  forts: Fort[];
  bossChars: Character[];
};

function spread(rng: Rng): { x: number; y: number } {
  return {
    x: rng.range(WORLD.MARGIN, WORLD.WIDTH - WORLD.MARGIN),
    y: rng.range(WORLD.MARGIN, WORLD.HEIGHT - WORLD.MARGIN),
  };
}

export function generateWorld(rng: Rng): WorldData {
  const cities: City[] = [];
  for (let i = 0; i < COUNTS.CITIES; i++) {
    const p = spread(rng);
    cities.push({
      id: allocId(),
      name: genCityName(rng),
      x: p.x,
      y: p.y,
      population: rng.int(80, 300),
      defense: rng.int(10, 60),
      residents: [],
      children: [],
      quests: [],
      events: [],
    });
  }

  const roads: Road[] = [];
  for (let i = 0; i < cities.length; i++) {
    let bestJ = -1;
    let best = Infinity;
    for (let j = 0; j < cities.length; j++) {
      if (i === j) continue;
      const d = dist2(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
      if (d < best) {
        best = d;
        bestJ = j;
      }
    }
    if (bestJ >= 0) {
      roads.push({
        ax: cities[i].x,
        ay: cities[i].y,
        bx: cities[bestJ].x,
        by: cities[bestJ].y,
      });
    }
  }

  const villages: Village[] = [];
  for (let i = 0; i < COUNTS.VILLAGES; i++) {
    const road = rng.pick(roads);
    const t = rng.next();
    const jitter = 80;
    villages.push({
      id: allocId(),
      name: genVillageName(rng, i),
      x: road.ax + (road.bx - road.ax) * t + rng.range(-jitter, jitter),
      y: road.ay + (road.by - road.ay) * t + rng.range(-jitter, jitter),
    });
  }

  const dungeons: Dungeon[] = [];
  for (let i = 0; i < COUNTS.DUNGEON; i++) {
    const p = spread(rng);
    dungeons.push({
      id: allocId(),
      x: p.x,
      y: p.y,
      cleared: false,
      legendaryWeapon: `伝説の武具#${i + 1}`,
      treasure: rng.int(500, 3000),
    });
  }

  const bosses: Boss[] = [];
  const bossChars: Character[] = [];
  for (let i = 0; i < COUNTS.BOSS; i++) {
    const p = spread(rng);
    const ch = createCharacter(rng, 'boss', p.x, p.y, null, null);
    bossChars.push(ch);
    bosses.push({ id: allocId(), charId: ch.id, x: p.x, y: p.y });
  }

  const forts: Fort[] = [];

  return { cities, villages, roads, dungeons, bosses, forts, bossChars };
}