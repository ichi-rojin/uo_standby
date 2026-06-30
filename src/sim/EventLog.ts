// 責務: 事件ログ・会話ログのデータ保持と購読
export type LogColor = 'red' | 'green' | 'gold' | 'yellow' | 'white';

export interface EventEntry {
  text: string;
  color: LogColor;
  charIds: number[];
}

export interface ChatEntry {
  id: number;
  from: number;
  to: number; // -1=対モンスター/独白
  fromName: string;
  toName: string;
  text: string;
}

export class EventLog {
  private events: EventEntry[] = [];
  private chats: ChatEntry[] = [];
  private chatSeq = 0;
  private readonly maxEvents = 200;
  private readonly maxChats = 40;
  onEvent: (() => void) | null = null;
  onChat: (() => void) | null = null;

  push(text: string, color: LogColor, charIds: number[]): void {
    this.events.unshift({ text, color, charIds });
    if (this.events.length > this.maxEvents) this.events.pop();
    if (this.onEvent) this.onEvent();
  }
  chat(from: number, to: number, fromName: string, toName: string, text: string): void {
    this.chats.unshift({ id: this.chatSeq++, from, to, fromName, toName, text });
    if (this.chats.length > this.maxChats) this.chats.pop();
    if (this.onChat) this.onChat();
  }
  removeChat(id: number): void {
    this.chats = this.chats.filter((c) => c.id !== id);
    if (this.onChat) this.onChat();
  }
  getEvents(): readonly EventEntry[] {
    return this.events;
  }
  getChats(): readonly ChatEntry[] {
    return this.chats;
  }
}