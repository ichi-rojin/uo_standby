// 責務: ダンジョンデータモデル(ボス/モンスター/財宝/伝説武器)
import type { Vec2 } from '../domain/types';

export class Dungeon {
  id: number;
  name: string;
  pos: Vec2;
  bossId: number;
  monsterIds: number[];
  treasureValue: number;
  legendName: string;
  cleared: boolean;
  clearProgress: number;

  constructor(id: number, name: string, pos: Vec2, legendName: string) {
    this.id = id;
    this.name = name;
    this.pos = pos;
    this.bossId = -1;
    this.monsterIds = [];
    this.treasureValue = 0;
    this.legendName = legendName;
    this.cleared = false;
    this.clearProgress = 0;
  }
}