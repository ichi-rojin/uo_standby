// 責務: 第2便システム群をGameへ統合する拡張モジュール
import { Container } from 'pixi.js';
import { Rng } from '../core/rng';
import { TimeSystem } from '../core/timeSystem';
import { LogSystem } from '../ui/logSystem';
import { SpatialGrid } from '../core/spatialGrid';
import { Character } from '../entities/character';
import type { Place } from '../entities/place';
import { ReproductionSystem } from '../sim/reproductionSystem';
import { EmotionSystemRunner } from '../sim/emotionRunner';
import { FortSystem } from '../sim/fortSystem';
import { DungeonSystem } from '../sim/dungeonSystem';
import { QuestSystem } from '../sim/questSystem';
import { FortView } from '../render/fortView';
import { DungeonView } from '../render/dungeonView';
import { grantLegendary } from '../sim/legendarySystem';
import { DUNGEON } from '../config/constants2';

export interface ExtContext {
  rng: Rng;
  time: TimeSystem;
  log: LogSystem;
  grid: SpatialGrid;
  cities: Place[];
  charById: Map<number, Character>;
  registerCharacter: (c: Character) => void;
  fortLayer: Container;
  dungeonLayer: Container;
  nextId: () => number;
}

export class GameExtensions {
  repro: ReproductionSystem;
  emotion: EmotionSystemRunner;
  forts: FortSystem;
  dungeons: DungeonSystem;
  quests: QuestSystem;
  private fortViews = new Map<number, FortView>();
  private dungeonViews = new Map<number, DungeonView>();

  constructor(private ctx: ExtContext) {
    this.repro = new ReproductionSystem();
    this.emotion = new EmotionSystemRunner();
    this.forts = new FortSystem(ctx.nextId);
    this.dungeons = new DungeonSystem(ctx.rng, ctx.nextId);
    this.quests = new QuestSystem();
  }

  init(): void {
    const spawn = this.dungeons.generate();
    for (const b of spawn.bosses) this.ctx.registerCharacter(b);
    for (const m of spawn.dungeonMonsters) this.ctx.registerCharacter(m);
    for (const d of spawn.dungeons) {
      const v = new DungeonView(d);
      this.ctx.dungeonLayer.addChild(v.container);
      this.dungeonViews.set(d.id, v);
    }
    for (const city of this.ctx.cities) {
      this.quests.issue(city, null);
    }
  }

  step(): void {
    const tick = this.ctx.time.tick;
    this.stepReproduction(tick);
    this.stepEmotion(tick);
    this.stepForts(tick);
    this.stepDungeons(tick);
    this.syncViews();
  }

  private stepReproduction(tick: number): void {
    if (tick % 4 !== 0) return;
    const npcs = [...this.ctx.charById.values()].filter((c) => c.kind === 'npc' && c.alive);
    for (const a of npcs) {
      if (!this.repro.canMate(a, tick)) continue;
      const near = this.ctx.grid.queryRadius(a.pos, 40);
      for (const id of near) {
        if (id === a.id) continue;
        const b = this.ctx.charById.get(id);
        if (!b || b.kind !== 'npc') continue;
        const child = this.repro.tryMate(a, b, tick, this.ctx.rng);
        if (child) {
          const city = this.ctx.cities.find((p) => p.id === child.cityId);
          if (city) {
            city.population += 1;
            city.events.push(`${a.givenName}と${b.givenName}に子が生まれた`);
          }
          this.ctx.log.pushEvent(`${a.fullName()}と${b.fullName()}に子が生まれた。`, 'relation', [a.id, b.id]);
        }
        break;
      }
    }
    const grown = this.repro.promoteMature(tick, this.ctx.cities, this.ctx.rng, this.ctx.nextId);
    for (const c of grown) {
      this.ctx.registerCharacter(c);
      this.ctx.charById.set(c.id, c);
      this.ctx.log.pushEvent(`${c.fullName()}が成人し冒険に出た。`, 'relation', [c.id]);
    }
  }

  private stepEmotion(tick: number): void {
    if (tick % 6 !== 0) return;
    const events = this.emotion.run(this.ctx.charById, this.ctx.grid, this.ctx.rng);
    for (const ev of events) {
      this.ctx.log.pushEvent(ev.text, 'relation', [ev.aId, ev.bId]);
    }
  }

  private stepForts(tick: number): void {
    if (tick % 8 !== 0) return;
    const bandits = [...this.ctx.charById.values()].filter((c) => c.isBandit && c.alive);
    for (const b of bandits) {
      const built = this.forts.maybeBuild(b, tick);
      if (built) {
        this.ctx.log.pushEvent(built.text, 'default', built.charIds);
        const f = this.forts.fortHome(b);
        if (f) {
          const v = new FortView(f);
          this.ctx.fortLayer.addChild(v.container);
          this.fortViews.set(f.id, v);
        }
      }
      const home = this.forts.fortHome(b);
      if (home) {
        const near = this.ctx.grid.queryRadius(b.pos, 120);
        for (const id of near) {
          const t = this.ctx.charById.get(id);
          if (!t) continue;
          const ev = this.forts.recruit(b, t, tick);
          if (ev) { this.ctx.log.pushEvent(ev.text, 'default', ev.charIds); break; }
        }
      }
    }
    const decayed = this.forts.decayEmpty(tick);
    for (const ev of decayed) {
      this.ctx.log.pushEvent(ev.text, 'default', ev.charIds);
    }
    for (const [id, view] of [...this.fortViews]) {
      const f = this.forts.forts.find((x) => x.id === id);
      if (!f) {
        view.container.destroy({ children: true });
        this.fortViews.delete(id);
      } else {
        view.update(f);
      }
    }
  }

  private stepDungeons(tick: number): void {
    if (tick % 5 !== 0) return;
    for (const d of this.dungeons.dungeons) {
      if (d.cleared) continue;
      const boss = this.ctx.charById.get(d.bossId);
      const guardsAlive = d.monsterIds.some((id) => {
        const m = this.ctx.charById.get(id);
        return m && m.alive;
      });
      const bossAlive = boss && boss.alive;
      if (!bossAlive && !guardsAlive) {
        d.clearProgress++;
        if (d.clearProgress >= DUNGEON.CLEAR_TICKS) {
          d.cleared = true;
          this.awardDungeon(d.id, d.legendName, d.treasureValue, tick);
        }
      }
    }
  }

  private awardDungeon(dungeonId: number, legendName: string, value: number, tick: number): void {
    const dungeon = this.dungeons.dungeons.find((x) => x.id === dungeonId);
    if (!dungeon) return;
    let winner: Character | null = null;
    let bestPower = -1;
    const near = this.ctx.grid.queryRadius(dungeon.pos, 200);
    for (const id of near) {
      const c = this.ctx.charById.get(id);
      if (c && c.kind === 'npc' && c.alive && c.ab.power > bestPower) {
        bestPower = c.ab.power;
        winner = c;
      }
    }
    if (!winner) return;
    winner.inv.money += value;
    this.ctx.log.pushEvent(`${winner.fullName()}が${dungeon.name}の財宝(${value})を得た。`, 'treasure', [winner.id]);
    const text = grantLegendary(winner, legendName, tick);
    this.ctx.log.pushEvent(text, 'treasure', [winner.id]);
  }

  private syncViews(): void {
    for (const [id, view] of this.dungeonViews) {
      const d = this.dungeons.dungeons.find((x) => x.id === id);
      if (d) view.update(d);
    }
  }

  onCharacterDeath(id: number): void {
    this.forts.onMemberDeath(id);
  }
}