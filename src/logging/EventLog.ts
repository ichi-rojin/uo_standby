// 責務: 事件・出来事ログの保持。色種別・関係キャラクターIDを伴う。

import { LOG } from '../config/GameConfig';
import { LogColorKey } from '../domain/types';

export interface EventLogEntry {
  text: string;
  color: LogColorKey;
  relatedCharacterIds: number[];
}

export class EventLog {
  private readonly entries: EventLogEntry[] = [];
  private dirty = true;

  push(
    text: string,
    color: LogColorKey,
    relatedCharacterIds: number[]
  ): void {
    this.entries.push({ text, color, relatedCharacterIds });
    if (this.entries.length > LOG.MAX_EVENT_ENTRIES) {
      this.entries.shift();
    }
    this.dirty = true;
  }

  getEntries(): readonly EventLogEntry[] {
    return this.entries;
  }

  consumeDirty(): boolean {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }
}