// File: src/game/EventBus.ts
// 責務: システム間疎結合のためのイベント配信。ログ・エフェクトへの通知を仲介する。

import { Character } from '../entities/Character';
import { EventCategory } from '../ui/EventLog';

export interface WorldEvent {
  stamp: string;
  text: string;
  category: EventCategory;
  related: Character[];
}

export interface ChatEvent {
  stamp: string;
  message: string;
  speaker: Character;
}

export enum FxKind {
  Damage = 'damage',
  Heal = 'heal',
  Buff = 'buff',
  Debuff = 'debuff',
}

export interface FxEvent {
  kind: FxKind;
  x: number;
  y: number;
  amount: number;
}

export type WorldEventHandler = (e: WorldEvent) => void;
export type ChatEventHandler = (e: ChatEvent) => void;
export type FxEventHandler = (e: FxEvent) => void;

export class EventBus {
  private readonly worldHandlers: WorldEventHandler[];
  private readonly chatHandlers: ChatEventHandler[];
  private readonly fxHandlers: FxEventHandler[];

  constructor() {
    this.worldHandlers = [];
    this.chatHandlers = [];
    this.fxHandlers = [];
  }

  public onWorld(h: WorldEventHandler): void {
    this.worldHandlers.push(h);
  }

  public onChat(h: ChatEventHandler): void {
    this.chatHandlers.push(h);
  }

  public onFx(h: FxEventHandler): void {
    this.fxHandlers.push(h);
  }

  public emitWorld(e: WorldEvent): void {
    for (const h of this.worldHandlers) {
      h(e);
    }
  }

  public emitChat(e: ChatEvent): void {
    for (const h of this.chatHandlers) {
      h(e);
    }
  }

  public emitFx(e: FxEvent): void {
    for (const h of this.fxHandlers) {
      h(e);
    }
  }
}