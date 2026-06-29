// 責務: 都市・補給拠点を結ぶ道路グラフ(エッジ集合)の生成と保持。

import { City } from '../domain/City';
import { SupplyPost } from '../domain/SupplyPost';

export interface RoadEdge {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

interface Node {
  x: number;
  y: number;
}

export class RoadNetwork {
  readonly edges: RoadEdge[] = [];

  /**
   * 都市同士を最近傍で連結し、各都市から最寄り補給拠点群へ枝を伸ばす。
   * 最小全域木的に都市を繋ぐことで全都市が連結される。
   */
  build(cities: readonly City[], posts: readonly SupplyPost[]): void {
    this.edges.length = 0;
    this.connectCitiesMst(cities);
    this.attachPosts(cities, posts);
  }

  private connectCitiesMst(cities: readonly City[]): void {
    if (cities.length < 2) {
      return;
    }
    const connected = new Set<number>();
    connected.add(0);
    const nodes: Node[] = cities.map((c) => ({ x: c.x, y: c.y }));

    while (connected.size < cities.length) {
      let bestFrom = -1;
      let bestTo = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const i of connected) {
        for (let j = 0; j < cities.length; j++) {
          if (connected.has(j)) {
            continue;
          }
          const d = this.dist2(nodes[i], nodes[j]);
          if (d < bestDist) {
            bestDist = d;
            bestFrom = i;
            bestTo = j;
          }
        }
      }
      if (bestTo < 0) {
        break;
      }
      connected.add(bestTo);
      this.edges.push({
        ax: nodes[bestFrom].x,
        ay: nodes[bestFrom].y,
        bx: nodes[bestTo].x,
        by: nodes[bestTo].y,
      });
    }
  }

  private attachPosts(
    cities: readonly City[],
    posts: readonly SupplyPost[]
  ): void {
    for (const post of posts) {
      let bestCity: City | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const c of cities) {
        const d = this.dist2(
          { x: c.x, y: c.y },
          { x: post.x, y: post.y }
        );
        if (d < bestDist) {
          bestDist = d;
          bestCity = c;
        }
      }
      if (bestCity) {
        this.edges.push({
          ax: bestCity.x,
          ay: bestCity.y,
          bx: post.x,
          by: post.y,
        });
      }
    }
  }

  private dist2(a: Node, b: Node): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }
}