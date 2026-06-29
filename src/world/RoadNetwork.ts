// src/world/RoadNetwork.ts
// 責務: 都市・補給拠点を結ぶ道路網（近傍接続による疑似最小木）を構築する。O(N^2)を避け近傍数を制限。

import type { CityData, SupplyPostData, RoadSegment, Vec2 } from '../domain/types';
import { distanceSq } from '../util/math';

const MAX_NEIGHBORS = 3;

interface Node {
  position: Vec2;
}

export function buildRoadNetwork(
  cities: readonly CityData[],
  posts: readonly SupplyPostData[],
): RoadSegment[] {
  const nodes: Node[] = [];
  for (const c of cities) nodes.push({ position: c.position });
  for (const p of posts) nodes.push({ position: p.position });

  const segments: RoadSegment[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < nodes.length; i += 1) {
    const distances: { index: number; d: number }[] = [];
    for (let j = 0; j < nodes.length; j += 1) {
      if (i === j) continue;
      distances.push({ index: j, d: distanceSq(nodes[i].position, nodes[j].position) });
    }
    distances.sort((a, b) => a.d - b.d);
    const limit = Math.min(MAX_NEIGHBORS, distances.length);
    for (let k = 0; k < limit; k += 1) {
      const j = distances[k].index;
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push({
        from: { x: nodes[i].position.x, y: nodes[i].position.y },
        to: { x: nodes[j].position.x, y: nodes[j].position.y },
      });
    }
  }
  return segments;
}