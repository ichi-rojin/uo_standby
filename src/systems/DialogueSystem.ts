// File: src/systems/DialogueSystem.ts
// 責務: NPC同士の掛け合い・対モンスター掛け声など会話ログの自発生成を制御する。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { GameTime } from '../core/GameTime';
import { EventBus } from '../game/EventBus';
import { RelationSystem } from './RelationSystem';
import { RelationType } from '../domain/Relations';
import { EntityKind } from '../domain/types';
import { RelationConfig } from '../config/BehaviorConfig';
import { RNG } from '../core/RNG';
import { generateMonsterCry } from '../domain/Names';

const FRIEND_LINES: readonly string[] = ['調子はどうだ', '今日も無事だな', '酒でもどうだ'];
const RIVAL_LINES: readonly string[] = ['まだ腕は鈍ってないか', '勝負はこれからだ'];
const HATE_LINES: readonly string[] = ['二度と顔を見せるな', '貴様とは相容れぬ'];
const MONSTER_FACE_LINES: readonly string[] = ['いざ尋常に！', '退治してくれる！', '覚悟しろ怪物め'];

export class DialogueSystem {
  constructor(
    private readonly world: World,
    private readonly time: GameTime,
    private readonly bus: EventBus,
    private readonly relations: RelationSystem,
    private readonly rng: RNG,
  ) {}

  public update(): void {
    if (!this.rng.chance(0.3)) {
      return;
    }
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Npc || c.isDead()) {
        continue;
      }
      if (!this.rng.chance(0.02)) {
        continue;
      }
      this.tryConverse(c);
    }
    this.monsterCries();
  }

  private tryConverse(c: Character): void {
    const near = this.world.grid.queryRadius(
      c.x,
      c.y,
      RelationConfig.PROXIMITY_BOND_RANGE,
    );
    for (const other of near) {
      if (other.id === c.id) {
        continue;
      }
      if (other.kind === EntityKind.Monster || other.kind === EntityKind.Boss) {
        const stamp = this.time.formatStamp();
        this.bus.emitChat({ stamp, message: this.rng.pick(MONSTER_FACE_LINES), speaker: c });
        return;
      }
      if (other.kind === EntityKind.Npc && !other.isDead()) {
        const type = this.relations.store.classify(c.id, other.id);
        const line = this.lineFor(type);
        if (line) {
          const stamp = this.time.formatStamp();
          this.bus.emitChat({ stamp, message: line, speaker: c });
          return;
        }
      }
    }
  }

  private lineFor(type: RelationType): string | null {
    switch (type) {
      case RelationType.Friend:
      case RelationType.Love:
        return this.rng.pick(FRIEND_LINES);
      case RelationType.Rival:
        return this.rng.pick(RIVAL_LINES);
      case RelationType.Hate:
        return this.rng.pick(HATE_LINES);
      default:
        return null;
    }
  }

  private monsterCries(): void {
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Monster || c.isDead()) {
        continue;
      }
      if (this.rng.chance(0.002)) {
        const stamp = this.time.formatStamp();
        this.bus.emitChat({ stamp, message: generateMonsterCry(this.rng), speaker: c });
      }
    }
  }
}