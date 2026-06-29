// 責務: 会話ログ(掛け合い/掛け声/断末魔)の保持。右側スタック表示用。

import { LOG } from '../config/GameConfig';

export interface ConversationEntry {
  id: number;
  speakerId: number;
  speakerName: string;
  text: string;
  relatedCharacterIds: number[];
}

export class ConversationLog {
  private readonly entries: ConversationEntry[] = [];
  private nextId = 1;
  private dirty = true;

  push(
    speakerId: number,
    speakerName: string,
    text: string,
    relatedCharacterIds: number[]
  ): void {
    this.entries.push({
      id: this.nextId++,
      speakerId,
      speakerName,
      text,
      relatedCharacterIds,
    });
    if (this.entries.length > LOG.MAX_CONVERSATION_ENTRIES) {
      this.entries.shift();
    }
    this.dirty = true;
  }

  remove(id: number): void {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.entries.splice(idx, 1);
      this.dirty = true;
    }
  }

  getEntries(): readonly ConversationEntry[] {
    return this.entries;
  }

  consumeDirty(): boolean {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }
}