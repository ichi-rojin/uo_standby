// src/systems/EffectSystem.ts
// 責務: 視覚エフェクト（ダメージ表示・バフ/デバフリング・ヒットフラッシュ）の生成と寿命管理を担う。

import { WorldState } from '../world/WorldState';
import { nextEntityId } from '../domain/ids';
import { EffectKind } from '../domain/enums';
import type { Vec2 } from '../domain/types';
import { EFFECT } from '../config/constants';

const DAMAGE_COLOR = 0xff4444;
const BUFF_COLOR = 0x44ff88;
const DEBUFF_COLOR = 0xaa55ff;
const FLASH_COLOR = 0xffffff;

export class EffectSystem {
  spawnDamage(world: WorldState, position: Vec2, amount: number): void {
    world.effects.push({
      id: nextEntityId(),
      kind: EffectKind.DamageText,
      position: { x: position.x, y: position.y },
      age: 0,
      duration: EFFECT.DAMAGE_TEXT_SECONDS,
      text: `-${amount}`,
      color: DAMAGE_COLOR,
    });
    world.effects.push({
      id: nextEntityId(),
      kind: EffectKind.HitFlash,
      position: { x: position.x, y: position.y },
      age: 0,
      duration: EFFECT.HIT_FLASH_SECONDS,
      text: '',
      color: FLASH_COLOR,
    });
  }

  spawnBuff(world: WorldState, position: Vec2): void {
    world.effects.push({
      id: nextEntityId(),
      kind: EffectKind.BuffRing,
      position: { x: position.x, y: position.y },
      age: 0,
      duration: EFFECT.BUFF_RING_SECONDS,
      text: '',
      color: BUFF_COLOR,
    });
  }

  spawnDebuff(world: WorldState, position: Vec2): void {
    world.effects.push({
      id: nextEntityId(),
      kind: EffectKind.DebuffRing,
      position: { x: position.x, y: position.y },
      age: 0,
      duration: EFFECT.BUFF_RING_SECONDS,
      text: '',
      color: DEBUFF_COLOR,
    });
  }

  update(world: WorldState, dt: number): void {
    for (let i = world.effects.length - 1; i >= 0; i -= 1) {
      const e = world.effects[i];
      e.age += dt;
      if (e.kind === EffectKind.DamageText) {
        e.position.y -= dt * 30;
      }
      if (e.age >= e.duration) {
        world.effects.splice(i, 1);
      }
    }
  }
}