// src/render/FortRenderer.ts
// 責務: 砦のプロシージャル描画を砦スナップショットに同期して生成・更新・破棄する。

import { Container, Graphics } from 'pixi.js';
import type { FortSnapshot } from '../systems/FortRenderSupport';
import type { EntityId } from '../domain/ids';

const FORT_RADIUS = 70;

function buildFortGraphics(): Graphics {
  const g = new Graphics();
  g.rect(-FORT_RADIUS, -FORT_RADIUS * 0.6, FORT_RADIUS * 2, FORT_RADIUS * 1.2).fill({ color: 0x4a3a3a });
  g.rect(-FORT_RADIUS, -FORT_RADIUS, FORT_RADIUS * 0.4, FORT_RADIUS * 0.5).fill({ color: 0x5a4a4a });
  g.rect(FORT_RADIUS * 0.6, -FORT_RADIUS, FORT_RADIUS * 0.4, FORT_RADIUS * 0.5).fill({ color: 0x5a4a4a });
  g.moveTo(-FORT_RADIUS * 0.2, 0).lineTo(0, -FORT_RADIUS * 0.9).lineTo(FORT_RADIUS * 0.2, 0).fill({ color: 0x222020 });
  return g;
}

export class FortRenderer {
  readonly container: Container;
  private readonly visuals: Map<EntityId, Container> = new Map();

  constructor() {
    this.container = new Container();
  }

  update(snapshots: readonly FortSnapshot[]): void {
    const seen = new Set<EntityId>();
    for (const snap of snapshots) {
      seen.add(snap.id);
      let node = this.visuals.get(snap.id);
      if (!node) {
        node = new Container();
        node.addChild(buildFortGraphics());
        this.container.addChild(node);
        this.visuals.set(snap.id, node);
      }
      node.x = snap.position.x;
      node.y = snap.position.y;
    }
    for (const [id, node] of this.visuals) {
      if (!seen.has(id)) {
        node.destroy({ children: true });
        this.visuals.delete(id);
      }
    }
  }
}