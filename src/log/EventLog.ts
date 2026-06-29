// src/log/EventLog.ts
// 責務: 事件・出来事ログと会話ログのリングバッファ管理と購読通知を担う。

import { nextEntityId } from '../domain/ids';
import type { EntityId } from '../domain/ids';
import { EventCategory } from '../domain/enums';
import type { EventLogEntry, ChatLogEntry, GameDate } from '../domain/types';
import { LOG } from '../config/constants';
import { cloneDate } from '../util/time';

type EventListener = (entry: EventLogEntry) => void;
type ChatListener = (entry: ChatLogEntry) => void;

export class EventLog {
  private readonly events: EventLogEntry[] = [];
  private readonly chats: ChatLogEntry[] = [];
  private readonly eventListeners: EventListener[] = [];
  private readonly chatListeners: ChatListener[] = [];

  onEvent(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  onChat(listener: ChatListener): void {
    this.chatListeners.push(listener);
  }

  pushEvent(
    date: GameDate,
    category: EventCategory,
    message: string,
    relatedCharacterIds: EntityId[],
  ): void {
    const entry: EventLogEntry = {
      id: nextEntityId(),
      date: cloneDate(date),
      category,
      message,
      relatedCharacterIds,
    };
    this.events.push(entry);
    if (this.events.length > LOG.MAX_EVENT_ENTRIES) this.events.shift();
    for (const l of this.eventListeners) l(entry);
  }

  pushChat(date: GameDate, speakerId: EntityId, speakerName: string, message: string): void {
    const entry: ChatLogEntry = {
      id: nextEntityId(),
      date: cloneDate(date),
      speakerId,
      speakerName,
      message,
    };
    this.chats.push(entry);
    if (this.chats.length > LOG.MAX_CHAT_ENTRIES) this.chats.shift();
    for (const l of this.chatListeners) l(entry);
  }
}