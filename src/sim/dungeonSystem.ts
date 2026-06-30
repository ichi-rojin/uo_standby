// 責務: ダンジョン生成・ボス/モンスター配置・攻略判定・伝説武器付与
import { DUNGEON, LEGEND, WORLD } from '../config/constants2';
import { Dungeon } from '../entities/dungeon';
import { Character } from '../entities/character';
import { Rng } from '../core/rng';
import type { Place } from '../entities/place';

export interface DungeonSpawn {
  dungeons: Dungeon[];
  bosses: Character[];
  dungeonMonsters: Character[];
}

export interface DungeonEvent {
  text: string;
  charIds: number[];
  treasure: boolean;
}

export class DungeonSystem {
  dungeons: Dungeon[] = [];

  constructor(private rng: Rng, private nextId: () => number) {}

  generate(): DungeonSpawn {
    const bosses: Character[] = [];
    const dungeonMonsters: Character[] = [];
    for (let i = 0; i < DUNGEON.COUNT; i++) {
      const pos = {
        x: this.rng.range(WORLD.WIDTH * 0.1, WORLD.WIDTH * 0.9),
        y: this.rng.range(WORLD.HEIGHT * 0.1, WORLD.HEIGHT * 0.9)
      };
      const legend = LEGEND.NAMES[i % LEGEND.NAMES.length];
      const d = new Dungeon(this.nextId(), `迷宮${i + 1}`, pos, legend);
      d.treasureValue = DUNGEON.TREASURE_VALUE;
      const boss = this.makeBoss(d);
      d.bossId = boss.id;
      bosses.push(boss);
      for (let j = 0; j < DUNGEON.MONSTERS_PER; j++) {
        const m = this.makeGuard(d);
        d.monsterIds.push(m.id);
        dungeonMonsters.push(m);
      }
      this.dungeons.push(d);
    }
    return { dungeons: this.dungeons, bosses, dungeonMonsters };
  }

  private makeBoss(d: Dungeon): Character {
    const c = new Character(this.nextId(), 'boss', this.rng.chance(0.5) ? 'male' : 'female');
    c.surname = 'ボス';
    c.givenName = d.name;
    c.title = `${d.name}の主`;
    c.inv.weapon = 'magic';
    c.ab.maxHp = DUNGEON.BOSS_HP;
    c.ab.hp = c.ab.maxHp;
    c.ab.maxMp = 200;
    c.ab.mp = 200;
    c.ab.power = 40;
    c.ab.magic = 40;
    c.ab.agility = 18;
    c.ab.reaction = 18;
    c.ab.perception = 30;
    c.ab.dexterity = 25;
    c.ab.moral = -10;
    c.hueSeed = this.rng.next();
    c.pos = { x: d.pos.x, y: d.pos.y };
    c.goal = 'idle';
    return c;
  }

  private makeGuard(d: Dungeon): Character {
    const c = new Character(this.nextId(), 'monster', this.rng.chance(0.5) ? 'male' : 'female');
    c.surname = 'モンスター';
    c.givenName = `#${c.id}`;
    c.title = '番獣';
    c.inv.weapon = 'sword';
    c.ab.maxHp = this.rng.int(60, 150);
    c.ab.hp = c.ab.maxHp;
    c.ab.power = this.rng.int(15, 30);
    c.ab.agility = this.rng.int(8, 20);
    c.ab.reaction = this.rng.int(8, 20);
    c.ab.perception = this.rng.int(10, 25);
    c.ab.dexterity = this.rng.int(8, 20);
    c.ab.magic = this.rng.int(0, 15);
    c.ab.moral = -10;
    c.hueSeed = this.rng.next();
    c.pos = { x: d.pos.x + this.rng.range(-30, 30), y: d.pos.y + this.rng.range(-30, 30) };
    c.goal = 'wander';
    return c;
  }

  asPlaces(): Place[] {
    return [];
  }
}