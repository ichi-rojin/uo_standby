// 責務: ゲーム全体の統括(生成・更新ループ・描画同期・UI連携・全システム統合)
import { Application, Container, Graphics } from 'pixi.js';
import { WORLD, COUNTS, COLORS, COMBAT, TIME, ENTITY } from '../config/constants';
import { TimeSystem } from '../core/timeSystem';
import { SpatialGrid } from '../core/spatialGrid';
import { WorldGenerator } from '../world/worldGen';
import type { WorldData } from '../world/worldGen';
import { Character } from '../entities/character';
import type { Place } from '../entities/place';
import { CharacterView } from '../render/characterView';
import { PlaceView } from '../render/placeView';
import { EffectLayer } from '../render/effects';
import { CameraController } from '../render/cameraController';
import { DomOverlay } from '../ui/domOverlay';
import type { SpeedMode } from '../ui/domOverlay';
import { CharacterWindow } from '../ui/characterWindow';
import { CityWindow } from '../ui/cityWindow';
import { LogSystem } from '../ui/logSystem';
import { updateNeeds } from '../sim/needsSystem';
import { chooseGoal } from '../sim/goapSystem';
import { moveToward, wander } from '../sim/movement';
import { weaponRange, computeDamage, dodge } from '../sim/combatSystem';
import { adjustRelation } from '../sim/relationSystem';
import { GameExtensions } from './gameExtensions';
import type { ExtContext } from './gameExtensions';

const MONSTER_SHOUTS = ['グルォォ！', 'シャアアア！', 'ギギギッ', 'ウォオオン', 'キシャアア'];
const NPC_BATTLE_CRIES = ['覚悟！', '我が剣を受けよ！', '退かぬ！', 'ここで決める！'];
const NPC_GREETINGS = ['よい狩りを', '武運を祈る', '酒場で会おう', 'また会ったな'];

type PlaceContainer = Container & { _place?: Place };

export class Game {
  private app: Application;
  private worldGen: WorldGenerator;
  private world!: WorldData;
  private time: TimeSystem;
  private grid: SpatialGrid;
  private log: LogSystem;
  private overlay!: DomOverlay;
  private root: HTMLElement;
  private worldLayer: Container;
  private roadLayer: Graphics;
  private placeLayer: Container;
  private fortLayer: Container;
  private dungeonLayer: Container;
  private charLayer: Container;
  private effects: EffectLayer;
  private camera!: CameraController;
  private charById = new Map<number, Character>();
  private viewById = new Map<number, CharacterView>();
  private monsters: Character[] = [];
  private speed: SpeedMode = 'play';
  private openCharWindow: CharacterWindow | null = null;
  private openCityWindow: CityWindow | null = null;
  private ext!: GameExtensions;
  private placeClickBound = false;

  constructor(app: Application, root: HTMLElement) {
    this.app = app;
    this.root = root;
    this.worldGen = new WorldGenerator(12345);
    this.time = new TimeSystem();
    this.grid = new SpatialGrid();
    this.log = new LogSystem();
    this.worldLayer = new Container();
    this.roadLayer = new Graphics();
    this.placeLayer = new Container();
    this.fortLayer = new Container();
    this.dungeonLayer = new Container();
    this.charLayer = new Container();
    this.effects = new EffectLayer();
    this.worldLayer.addChild(
      this.roadLayer,
      this.dungeonLayer,
      this.placeLayer,
      this.fortLayer,
      this.charLayer,
      this.effects.container
    );
    this.app.stage.addChild(this.worldLayer);
  }

  init(): void {
    this.world = this.worldGen.generate();
    this.buildBackground();
    this.drawRoads();
    this.buildPlaces();
    for (const c of this.world.characters) {
      this.registerCharacter(c);
    }
    this.spawnMonstersUpTo(COUNTS.MONSTER_MIN);
    this.setupCamera();
    this.setupOverlay();
    this.setupExtensions();
    this.bindPlaceClicks();
    this.log.pushEvent('世界が生成された。', 'default', []);
    this.app.ticker.add(() => this.frame());
  }

  private setupExtensions(): void {
    const ctx: ExtContext = {
      rng: this.worldGen.getRng(),
      time: this.time,
      log: this.log,
      grid: this.grid,
      cities: this.world.cities,
      charById: this.charById,
      registerCharacter: (c: Character) => this.registerCharacter(c),
      fortLayer: this.fortLayer,
      dungeonLayer: this.dungeonLayer,
      nextId: () => this.worldGen.nextEntityId()
    };
    this.ext = new GameExtensions(ctx);
    this.ext.init();
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, WORLD.WIDTH, WORLD.HEIGHT).fill({ color: COLORS.BG });
    this.worldLayer.addChildAt(bg, 0);
  }

  private drawRoads(): void {
    this.roadLayer.clear();
    for (const r of this.world.roads) {
      this.roadLayer.moveTo(r.a.x, r.a.y).lineTo(r.b.x, r.b.y)
        .stroke({ width: 6, color: COLORS.ROAD, alpha: 0.4 });
    }
  }

  private buildPlaces(): void {
    for (const p of [...this.world.cities, ...this.world.supplies]) {
      const v = new PlaceView(p);
      v.container.eventMode = 'static';
      v.container.cursor = 'pointer';
      const pc = v.container as PlaceContainer;
      pc._place = p;
      this.placeLayer.addChild(pc);
    }
  }

  private bindPlaceClicks(): void {
    if (this.placeClickBound) return;
    this.placeClickBound = true;
    for (const child of this.placeLayer.children) {
      const cont = child as PlaceContainer;
      cont.on('pointertap', () => {
        if (cont._place) this.openCityWindowFor(cont._place);
      });
    }
  }

  private openCityWindowFor(p: Place): void {
    if (this.openCityWindow) { this.openCityWindow.el.remove(); this.openCityWindow = null; }
    this.openCityWindow = new CityWindow(
      this.root,
      p,
      (id) => this.charById.get(id),
      () => { if (this.openCityWindow) { this.openCityWindow.el.remove(); this.openCityWindow = null; } }
    );
    this.camera.jumpTo(p.pos.x, p.pos.y);
  }

  private registerCharacter(c: Character): void {
    if (this.charById.has(c.id) && this.viewById.has(c.id)) return;
    this.charById.set(c.id, c);
    if (c.kind === 'monster') this.monsters.push(c);
    const view = new CharacterView(c);
    view.container.eventMode = 'static';
    view.container.cursor = 'pointer';
    view.container.on('pointertap', () => this.openCharacterWindow(c.id));
    this.viewById.set(c.id, view);
    this.charLayer.addChild(view.container);
  }

  private spawnMonstersUpTo(target: number): void {
    let alive = 0;
    for (const m of this.monsters) if (m.alive) alive++;
    while (alive < target) {
      const m = this.worldGen.makeMonster(this.world.cities, this.world.supplies);
      this.registerCharacter(m);
      alive++;
    }
  }

  private setupCamera(): void {
    this.camera = new CameraController(this.app.stage, this.app.renderer.width, this.app.renderer.height);
    window.addEventListener('resize', () => {
      this.camera.resize(this.app.renderer.width, this.app.renderer.height);
    });
  }

  private setupOverlay(): void {
    this.overlay = new DomOverlay(this.root);
    this.overlay.onSpeedChange = (m) => { this.speed = m; };
    this.overlay.onCharClick = (id) => this.openCharacterWindow(id);
    this.overlay.onTalkClose = (id) => { this.log.removeTalk(id); };
  }

  private openCharacterWindow(id: number): void {
    const c = this.charById.get(id);
    if (!c) return;
    if (this.openCharWindow) { this.openCharWindow.el.remove(); this.openCharWindow = null; }
    if (c.alive) this.camera.setFollow(c);
    else this.camera.jumpTo(c.pos.x, c.pos.y);
    this.openCharWindow = new CharacterWindow(this.root, c, this.time, {
      onHeal: (ch) => {
        ch.ab.hp = ch.ab.maxHp;
        ch.ab.mp = ch.ab.maxMp;
        ch.ab.health = 100;
        this.effects.heal(ch.pos.x, ch.pos.y, ch.ab.maxHp);
      },
      onRevive: (ch) => this.reviveCharacter(ch),
      onCamera: (ch) => this.camera.setFollow(ch),
      onClose: () => { if (this.openCharWindow) { this.openCharWindow.el.remove(); this.openCharWindow = null; } }
    });
  }

  private reviveCharacter(c: Character): void {
    c.alive = true;
    c.ab.hp = c.ab.maxHp;
    c.ab.mp = c.ab.maxMp;
    c.ab.health = 100;
    c.deathTick = -1;
    c.addHistory(this.time.tick, '復活した');
    this.effects.heal(c.pos.x, c.pos.y, c.ab.maxHp);
    this.log.pushEvent(`${c.fullName()}が復活した。`, 'default', [c.id]);
  }

  private frame(): void {
    const steps = this.speed === 'pause' ? 0 : this.speed === 'fast' ? 2 : 1;
    for (let i = 0; i < steps; i++) this.simStep();
    this.syncViews();
    this.effects.update();
    this.camera.update();
    this.overlay.setClock(this.time.format());
    this.overlay.renderEvents(this.log.events);
    this.overlay.renderTalks(this.log.talks);
    if (this.openCharWindow) {
      this.refreshOpenCharWindow();
    }
  }

  private refreshOpenCharWindow(): void {
    if (this.time.tick % 10 === 0 && this.openCharWindow) {
      for (const c of this.charById.values()) {
        if (this.camera.follow === c) {
          this.openCharWindow.render(c, this.time);
          break;
        }
      }
    }
  }

  private rebuildGrid(): void {
    this.grid.clear();
    for (const c of this.charById.values()) {
      if (c.alive) this.grid.insert(c.id, c.pos);
    }
  }

  private simStep(): void {
    this.time.advance();
    this.rebuildGrid();
    for (const p of [...this.world.cities, ...this.world.supplies]) {
      p.presentNpcIds.clear();
    }
    for (const c of this.charById.values()) {
      if (!c.alive) { this.handleDead(c); continue; }
      updateNeeds(c);
      if (c.buffTicks > 0) c.buffTicks--;
      if (c.debuffTicks > 0) c.debuffTicks--;
      if (c.attackCooldown > 0) c.attackCooldown--;
      this.act(c);
    }
    this.ext.step();
    if (this.time.tick % 30 === 0) {
      this.spawnMonstersUpTo(COUNTS.MONSTER_MIN);
    }
  }

  private handleDead(c: Character): void {
    if (c.deathTick >= 0 && this.time.tick - c.deathTick > ENTITY.DEATH_GRAY_TICKS) {
      const view = this.viewById.get(c.id);
      if (view) { view.destroy(); this.viewById.delete(c.id); }
      this.charById.delete(c.id);
    }
  }

  private act(c: Character): void {
    const goal = chooseGoal(c, this.world.cities);
    c.goal = goal;
    const enemy = this.findEnemy(c);
    if (enemy) { this.engage(c, enemy); return; }
    if (goal === 'goCity' && c.targetPos) {
      moveToward(c, c.targetPos.x, c.targetPos.y);
      this.tryRecover(c);
    } else {
      wander(c, () => Math.random());
      this.tryRecover(c);
      this.maybeGreet(c);
    }
  }

  private maybeGreet(c: Character): void {
    if (c.kind !== 'npc') return;
    if (Math.random() > 0.004) return;
    const near = this.grid.queryRadius(c.pos, 60);
    for (const id of near) {
      if (id === c.id) continue;
      const o = this.charById.get(id);
      if (o && o.kind === 'npc' && o.alive) {
        this.log.pushTalk(c.fullName(), c.id, NPC_GREETINGS[c.id % NPC_GREETINGS.length]);
        adjustRelation(c, o, 1);
        return;
      }
    }
  }

  private tryRecover(c: Character): void {
    for (const p of [...this.world.cities, ...this.world.supplies]) {
      const dx = p.pos.x - c.pos.x;
      const dy = p.pos.y - c.pos.y;
      const r = p.kind === 'city' ? ENTITY.CITY_RADIUS : ENTITY.SUPPLY_RADIUS;
      if (dx * dx + dy * dy < r * r * 6) {
        c.ab.hp = Math.min(c.ab.maxHp, c.ab.hp + 5);
        c.ab.mp = Math.min(c.ab.maxMp, c.ab.mp + 3);
        c.ab.health = Math.min(100, c.ab.health + 1);
        c.needs.hunger = Math.max(0, c.needs.hunger - 10);
        if (c.inv.food < 10) c.inv.food += 1;
        if (c.kind === 'npc') p.presentNpcIds.add(c.id);
        return;
      }
    }
  }

  private findEnemy(c: Character): Character | null {
    const range = Math.max(weaponRange(c) + 30, c.ab.perception * 16);
    const near = this.grid.queryRadius(c.pos, range);
    let best: Character | null = null;
    let bestD = Infinity;
    for (const id of near) {
      if (id === c.id) continue;
      const o = this.charById.get(id);
      if (!o || !o.alive) continue;
      if (!this.isHostile(c, o)) continue;
      const dx = o.pos.x - c.pos.x;
      const dy = o.pos.y - c.pos.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  private isHostile(a: Character, b: Character): boolean {
    if (a.kind === 'monster' && b.kind !== 'monster') return true;
    if (a.kind === 'boss' && b.kind === 'npc') return true;
    if (a.kind !== 'monster' && a.kind !== 'boss' && (b.kind === 'monster' || b.kind === 'boss')) return true;
    if (a.isBandit && b.kind === 'npc' && !b.isBandit) return true;
    if ((a.relations[b.id] ?? 0) <= -60) return true;
    return false;
  }

  private engage(c: Character, enemy: Character): void {
    const range = weaponRange(c);
    const dx = enemy.pos.x - c.pos.x;
    const dy = enemy.pos.y - c.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) { moveToward(c, enemy.pos.x, enemy.pos.y); return; }
    if (c.attackCooldown > 0) return;
    c.attackCooldown = COMBAT.ATTACK_COOLDOWN_TICKS;

    if (c.inv.weapon === 'magic') {
      if (c.ab.mp >= 5) {
        c.ab.mp -= 5;
      } else if (c.ab.mp >= 3 && c.ab.hp < c.ab.maxHp * 0.5) {
        c.ab.mp -= 3;
        const heal = c.ab.magic;
        c.ab.hp = Math.min(c.ab.maxHp, c.ab.hp + heal);
        this.effects.heal(c.pos.x, c.pos.y - 10, heal);
        return;
      }
    }

    this.emitBattleVoice(c);
    if (dodge(enemy)) return;

    let dmg = computeDamage(c);
    if (c.skills.special > 50 && Math.random() < 0.1) {
      dmg *= 2;
      this.effects.ring(c.pos.x, c.pos.y, 'buff');
    }
    enemy.ab.hp -= dmg;
    this.effects.damage(enemy.pos.x, enemy.pos.y - 10, dmg);

    if (Math.random() < 0.05) {
      enemy.buffTicks = 0;
      enemy.debuffTicks = 30;
      this.effects.ring(enemy.pos.x, enemy.pos.y, 'debuff');
    }

    if (enemy.ab.hp <= 0) this.kill(c, enemy);
  }

  private emitBattleVoice(c: Character): void {
    if (c.kind === 'monster' || c.kind === 'boss') {
      if (Math.random() < 0.02) {
        this.log.pushTalk(c.title, c.id, MONSTER_SHOUTS[c.id % MONSTER_SHOUTS.length]);
      }
    } else if (Math.random() < 0.03) {
      this.log.pushTalk(c.fullName(), c.id, NPC_BATTLE_CRIES[c.id % NPC_BATTLE_CRIES.length]);
    }
  }

  private kill(killer: Character, victim: Character): void {
    victim.alive = false;
    victim.ab.hp = 0;
    victim.deathTick = this.time.tick;
    killer.inv.money += victim.inv.money;
    killer.inv.valuables += victim.inv.valuables;
    victim.inv.money = 0;
    victim.inv.valuables = 0;
    killer.ab.honor += 2;
    killer.needs.growth = Math.max(0, killer.needs.growth - 20);
    killer.needs.greed = Math.max(0, killer.needs.greed - 15);

    const kn = killer.kind === 'npc' ? killer.fullName() : killer.title;
    const vn = victim.kind === 'npc' ? victim.fullName() : victim.title;
    killer.addHistory(this.time.tick, `${vn}を討伐した`);
    victim.addHistory(this.time.tick, `${kn}に敗れた`);
    this.log.pushEvent(`${kn}が${vn}を倒した。`, 'death', [killer.id, victim.id]);

    if (killer.inv.money > victim.inv.money) {
      this.log.pushEvent(`${kn}は戦利品を奪った。`, 'money', [killer.id]);
    }
    if (victim.kind === 'npc') {
      this.log.pushTalk(victim.fullName(), victim.id, 'ぐあっ…無念…');
    }
    if (killer.kind === 'npc' && victim.kind === 'npc') {
      adjustRelation(victim, killer, -80);
    }
    this.ext.onCharacterDeath(victim.id);
  }

  private syncViews(): void {
    for (const [id, view] of this.viewById) {
      const c = this.charById.get(id);
      if (!c) continue;
      view.update(c);
      view.updateName(c);
    }
    if (this.openCityWindow) {
      for (const child of this.placeLayer.children) {
        const cont = child as PlaceContainer;
        if (cont._place) {
          const pv = cont as PlaceContainer;
          void pv;
        }
      }
    }
  }

  static usedConstants(): number {
    return TIME.TICK_MS;
  }
}