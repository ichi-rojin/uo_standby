// 責務: ボスの大型プロシージャル描画
import { Graphics } from 'pixi.js';
import { monsterColor } from './proceduralTextures';
import type { Character } from '../entities/character';

export function drawBossBody(g: Graphics, c: Character): void {
  g.clear();
  const r = 20;
  const color = monsterColor(c.hueSeed, 30);
  const spikes = 12;
  let started = false;
  for (let i = 0; i < spikes; i++) {
    const a1 = (i / spikes) * Math.PI * 2;
    const a2 = ((i + 0.5) / spikes) * Math.PI * 2;
    const ox = Math.cos(a1) * r;
    const oy = Math.sin(a1) * r;
    const ix = Math.cos(a2) * r * 0.5;
    const iy = Math.sin(a2) * r * 0.5;
    if (!started) { g.moveTo(ox, oy); started = true; } else { g.lineTo(ox, oy); }
    g.lineTo(ix, iy);
  }
  g.closePath().fill({ color });
  g.circle(-6, -4, 3).fill({ color: 0xff0000 });
  g.circle(6, -4, 3).fill({ color: 0xff0000 });
}