// 責務: ゲーム全体の可変状態を保持し、エンティティ参照を集約管理
import type {
  Boss,
  Character,
  City,
  Dungeon,
  EffectKind,
  Effect,
  EntityId,
  EventLogEntry,
  Fort,
  Road,
  TalkLogEntry,
  Village,
} from '../domain/types';
import { LOG } from '../config/constants';

export class GameState {
  characters: Map<EntityId, Character> = new Map();
  cities: City[] = [];
  villages: Village[] = [];
  roads: Road[] = [];
  dungeons: Dungeon[] = [];
  bosses: Boss[] = [];
  forts: Fort[] = [];
  effects: Effect[] = [];
  eventLog: EventLogEntry[] = [];
  talkLog: TalkLogEntry[] = [];
  tick = 0;
  speed = 1;
  private talkSeq = 1;

  cityById(id: EntityId): City | undefined {
    return this.cities.find((c) => c.id === id);
  }

  fortById(id: EntityId): Fort | undefined {
    return this.forts.find((f) => f.id === id);
  }

  addEvent(text: string, color: number, refs: EntityId[]): void {
    this.eventLog.push({ text, color, refs });
    if (this.eventLog.length > LOG.MAX_EVENT) this.eventLog.shift();
  }

  addTalk(from: EntityId, to: EntityId | null, text: string): void {
    this.talkLog.push({ id: this.talkSeq++, from, to, text });
    if (this.talkLog.length > LOG.MAX_TALK) this.talkLog.shift();
  }

  addEffect(x: number, y: number, kind: EffectKind, value: number, ttl: number): void {
    this.effects.push({ x, y, kind, value, ttl });
  }

  livingNpcCount(): number {
    let n = 0;
    for (const c of this.characters.values()) {
      if (c.alive && (c.kind === 'npc' || c.kind === 'bandit')) n++;
    }
    return n;
  }

  livingMonsterCount(): number {
    let n = 0;
    for (const c of this.characters.values()) {
      if (c.alive && c.kind === 'monster') n++;
    }
    return n;
  }
}