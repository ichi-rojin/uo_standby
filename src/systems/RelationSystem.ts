// File: src/systems/RelationSystem.ts
// 責務: 近接によるNPC間感情変化と種別遷移の検出、関係変化ログ・会話の発火。

import { World } from '../world/World';
import { Character } from '../entities/Character';
import { GameTime } from '../core/GameTime';
import { EventBus } from '../game/EventBus';
import { EventCategory } from '../ui/EventLog';
import { RelationStore, RelationType } from '../domain/Relations';
import { RelationConfig } from '../config/BehaviorConfig';
import { EntityKind } from '../domain/types';
import { RNG } from '../core/RNG';

export class RelationSystem {
  public readonly store: RelationStore;

  constructor(
    private readonly world: World,
    private readonly time: GameTime,
    private readonly bus: EventBus,
    private readonly rng: RNG,
  ) {
    this.store = new RelationStore();
  }

  public update(): void {
    for (const c of this.world.characters.values()) {
      if (c.kind !== EntityKind.Npc || c.isDead()) {
        continue;
      }
      const neighbors = this.world.grid.queryRadius(
        c.x,
        c.y,
        RelationConfig.PROXIMITY_BOND_RANGE,
      );
      for (const other of neighbors) {
        if (other.id === c.id || other.kind !== EntityKind.Npc || other.isDead()) {
          continue;
        }
        this.bond(c, other);
      }
    }
  }

  private bond(a: Character, b: Character): void {
    const before = this.store.classify(a.id, b.id);
    const delta = a.isEvil === b.isEvil
      ? RelationConfig.BOND_PER_TICK
      : -RelationConfig.BOND_PER_TICK;
    this.store.adjust(a.id, b.id, delta);
    const after = this.store.classify(a.id, b.id);
    if (before !== after) {
      this.reportTransition(a, b, after);
    }
  }

  public onAttacked(victim: Character, attacker: Character): void {
    const before = this.store.classify(victim.id, attacker.id);
    this.store.adjust(victim.id, attacker.id, -RelationConfig.HATE_ON_ATTACK);
    const after = this.store.classify(victim.id, attacker.id);
    if (before !== after && after === RelationType.Hate) {
      this.reportTransition(victim, attacker, after);
    }
  }

  public growLove(a: Character, b: Character): void {
    this.store.adjust(a.id, b.id, RelationConfig.LOVE_GROWTH_PER_TICK);
    this.store.adjust(b.id, a.id, RelationConfig.LOVE_GROWTH_PER_TICK);
  }

  private reportTransition(a: Character, b: Character, type: RelationType): void {
    const stamp = this.time.formatStamp();
    let text = '';
    let chat = '';
    switch (type) {
      case RelationType.Friend:
        text = `${a.fullName} と ${b.fullName} は友情で結ばれた`;
        chat = '頼りにしているぞ';
        break;
      case RelationType.Rival:
        text = `${a.fullName} は ${b.fullName} を好敵手と認めた`;
        chat = '次は負けんぞ';
        break;
      case RelationType.Hate:
        text = `${a.fullName} は ${b.fullName} を憎悪している`;
        chat = '貴様だけは許さん';
        break;
      case RelationType.Love:
        text = `${a.fullName} と ${b.fullName} の間に恋が芽生えた`;
        chat = '君と共にありたい';
        break;
      default:
        return;
    }
    a.addHistory(stamp, type === RelationType.Hate
      ? `${b.fullName}と対立した`
      : `${b.fullName}と関係が深まった`);
    this.bus.emitWorld({
      stamp,
      text,
      category: EventCategory.Relation,
      related: [a, b],
    });
    if (this.rng.chance(0.5)) {
      this.bus.emitChat({ stamp, message: chat, speaker: a });
    }
  }
}