// 責務: 都市クエストの発注・受託・達成判定
import type { Place, Quest } from '../entities/place';
import type { Character } from '../entities/character';

const QUEST_TEMPLATES = ['モンスター討伐', '宅配', '買い物', 'ボディガード', '暗殺', 'ダンジョン探索'];

export class QuestSystem {
  private seq = 0;

  issue(city: Place, taker: Character | null): Quest {
    const desc = QUEST_TEMPLATES[this.seq % QUEST_TEMPLATES.length];
    const q: Quest = {
      id: this.seq++,
      desc,
      takerName: taker ? taker.fullName() : '未受託',
      done: null
    };
    city.quests.push(q);
    if (city.quests.length > 8) city.quests.shift();
    return q;
  }

  complete(city: Place, success: boolean): void {
    const open = city.quests.find((q) => q.done === null);
    if (open) {
      open.done = success;
      city.population += success ? 1 : -1;
      if (city.population < 0) city.population = 0;
    }
  }
}