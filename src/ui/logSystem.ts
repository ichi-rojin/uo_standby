// 責務: 出来事ログ・会話ログのデータ管理
import { LOG } from '../config/constants';
import type { LogCategory } from '../domain/types';

export interface EventLogItem {
  id: number;
  text: string;
  category: LogCategory;
  charIds: number[];
}

export interface TalkLogItem {
  id: number;
  speaker: string;
  speakerId: number;
  text: string;
}

export class LogSystem {
  events: EventLogItem[] = [];
  talks: TalkLogItem[] = [];
  private seq = 0;

  pushEvent(text: string, category: LogCategory, charIds: number[]): void {
    this.events.unshift({ id: this.seq++, text, category, charIds });
    if (this.events.length > LOG.MAX_EVENT) this.events.pop();
  }

  pushTalk(speaker: string, speakerId: number, text: string): void {
    this.talks.unshift({ id: this.seq++, speaker, speakerId, text });
    if (this.talks.length > LOG.MAX_TALK) this.talks.pop();
  }

  removeTalk(id: number): void {
    this.talks = this.talks.filter((t) => t.id !== id);
  }

  static colorOf(category: LogCategory): string {
    switch (category) {
      case 'death': return LOG.COLOR_DEATH;
      case 'relation': return LOG.COLOR_RELATION;
      case 'treasure': return LOG.COLOR_TREASURE;
      case 'money': return LOG.COLOR_MONEY;
      default: return LOG.COLOR_DEFAULT;
    }
  }
}