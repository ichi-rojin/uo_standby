// File: src/game/Game.ts
// 責務: ゲーム全体の統合。Pixi初期化・ワールド・描画・入力・ループ・AI/戦闘/感情/夜盗/交配/会話を束ねる。

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RNG } from '../core/RNG';
import { GameTime } from '../core/GameTime';
import { World } from '../world/World';
import { WorldGenerator } from '../world/WorldGenerator';
import { Camera } from '../render/Camera';
import { CharacterView } from '../render/CharacterView';
import { CityView, SupplyView } from '../render/CityView';
import { FortView } from '../render/FortView';
import { EffectLayer } from '../render/EffectLayer';
import { RespawnSystem } from '../systems/RespawnSystem';
import { RecoverySystem } from '../systems/RecoverySystem';
import { CombatSystem } from '../systems/CombatSystem';
import { RelationSystem } from '../systems/RelationSystem';
import { BanditSystem } from '../systems/BanditSystem';
import { MatingSystem } from '../systems/MatingSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { EventLog } from '../ui/EventLog';
import { ChatLog } from '../ui/ChatLog';
import { WindowManager, FollowHandle } from '../ui/WindowManager';
import { EventBus, FxKind } from './EventBus';
import { Fort } from '../entities/Fort';
import { Character } from '../entities/Character';
import { CharacterState, EntityKind } from '../domain/types';
import { Planner } from '../ai/Planner';
import { ActionName } from '../ai/Actions';
import { AgentState } from '../ai/Goap';
import {
  WorldConfig,
  ColorConfig,
  RenderConfig,
  TimeConfig,
  CameraConfig,
  StatsConfig,
} from '../config/GameConfig';
import { CombatConfig, DesireConfig, MatingConfig } from '../config/BehaviorConfig';

const SECONDS_PER_MS = 0.001;
const MOVE_BASE_SPEED = 30;
const MOVE_AGILITY_SCALE = 2;
const TARGET_REACH = 4;

export class Game implements FollowHandle {
  private app!: Application;
  private worldContainer!: Container;
  private groundLayer!: Container;
  private roadLayer!: Graphics;
  private fortLayer!: Container;
  private cityLayer!: Container;
  private charLayer!: Container;
  private effectLayer!: EffectLayer;
  private camera!: Camera;

  private readonly rng: RNG;
  private readonly time: GameTime;
  private readonly bus: EventBus;
  private world!: World;
  private generator!: WorldGenerator;
  private planner!: Planner;

  private respawn!: RespawnSystem;
  private recovery!: RecoverySystem;
  private combat!: CombatSystem;
  private relations!: RelationSystem;
  private bandits!: BanditSystem;
  private mating!: MatingSystem;
  private dialogue!: DialogueSystem;

  private readonly charViews: Map<number, CharacterView>;
  private readonly cityViews: CityView[];
  private readonly fortViews: Map<number, FortView>;

  private eventLog!: EventLog;
  private chatLog!: ChatLog;
  private windows!: WindowManager;
  private clock!: Text;

  private followTarget: Character | null;
  private keyDown: Set<string>;
  private ctrlDragging: boolean;
  private lastPointerX: number;
  private lastPointerY: number;

  constructor() {
    this.rng = new RNG(123456789);
    this.time = new GameTime();
    this.bus = new EventBus();
    this.charViews = new Map();
    this.cityViews = [];
    this.fortViews = new Map();
    this.followTarget = null;
    this.keyDown = new Set();
    this.ctrlDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
  }

  public async start(host: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: ColorConfig.BACKGROUND,
      resizeTo: window,
      antialias: true,
    });
    host.appendChild(this.app.canvas);

    this.setupLayers();
    this.buildWorld();
    this.setupSystems();
    this.setupCamera();
    this.setupUI(host);
    this.wireBus();
    this.setupInput();
    this.setupToolbar(host);

    this.app.ticker.add(() => this.onTick());
  }

  private setupLayers(): void {
    this.worldContainer = new Container();
    this.groundLayer = new Container();
    this.roadLayer = new Graphics();
    this.fortLayer = new Container();
    this.cityLayer = new Container();
    this.charLayer = new Container();
    this.effectLayer = new EffectLayer();

    this.worldContainer.addChild(this.groundLayer);
    this.worldContainer.addChild(this.roadLayer);
    this.worldContainer.addChild(this.fortLayer);
    this.worldContainer.addChild(this.cityLayer);
    this.worldContainer.addChild(this.charLayer);
    this.worldContainer.addChild(this.effectLayer.container);
    this.app.stage.addChild(this.worldContainer);

    const ground = new Graphics();
    ground.rect(0, 0, WorldConfig.WIDTH, WorldConfig.HEIGHT).fill({ color: ColorConfig.GRASS });
    this.groundLayer.addChild(ground);
  }

  private buildWorld(): void {
    this.generator = new WorldGenerator(this.rng);
    this.planner = new Planner();
    const generated = this.generator.generate();
    this.world = new World(generated.cities, generated.supplies, generated.roads);

    this.drawRoads();

    for (const s of this.world.supplies) {
      const view = new SupplyView(s);
      this.cityLayer.addChild(view.container);
    }
    for (const c of this.world.cities) {
      const view = new CityView(c);
      view.container.eventMode = 'static';
      view.container.cursor = 'pointer';
      view.container.on('pointertap', () => this.windows.openCity(c));
      this.cityLayer.addChild(view.container);
      this.cityViews.push(view);
    }
    for (const c of generated.characters) {
      this.world.addCharacter(c);
      this.addCharacterView(c);
    }
  }

  private setupSystems(): void {
    this.respawn = new RespawnSystem(this.world, this.generator);
    this.recovery = new RecoverySystem(this.world);
    this.relations = new RelationSystem(this.world, this.time, this.bus, this.rng);
    this.combat = new CombatSystem(this.world, this.time, this.bus, this.rng, this.relations);
    this.bandits = new BanditSystem(this.world, this.time, this.bus, this.rng);
    this.mating = new MatingSystem(
      this.world,
      this.time,
      this.bus,
      this.relations,
      this.rng,
      this.generator,
    );
    this.dialogue = new DialogueSystem(this.world, this.time, this.bus, this.relations, this.rng);
    this.bandits.setLifecycle({
      onFortCreated: (f) => this.addFortView(f),
      onFortDecayed: (f) => this.removeFortView(f),
    });
  }

  private drawRoads(): void {
    this.roadLayer.clear();
    for (const r of this.world.roads) {
      this.roadLayer
        .moveTo(r.ax, r.ay)
        .lineTo(r.bx, r.by)
        .stroke({ width: RenderConfig.ROAD_WIDTH, color: ColorConfig.ROAD, alpha: 0.5 });
    }
  }

  private addCharacterView(c: Character): void {
    const view = new CharacterView(c);
    view.container.eventMode = 'static';
    view.container.cursor = 'pointer';
    view.container.on('pointertap', () => this.windows.openCharacter(c));
    this.charLayer.addChild(view.container);
    this.charViews.set(c.id, view);
  }

  private addFortView(f: Fort): void {
    const view = new FortView(f);
    this.fortLayer.addChild(view.container);
    this.fortViews.set(f.id, view);
  }

  private removeFortView(f: Fort): void {
    const view = this.fortViews.get(f.id);
    if (view) {
      view.destroy();
      this.fortViews.delete(f.id);
    }
  }

  private setupCamera(): void {
    this.camera = new Camera(this.worldContainer, window.innerWidth, window.innerHeight);
    window.addEventListener('resize', () => {
      this.camera.resize(window.innerWidth, window.innerHeight);
    });
  }

  private setupUI(host: HTMLElement): void {
    this.windows = new WindowManager(host, this);
    this.eventLog = new EventLog((c) => this.windows.openCharacter(c));
    this.chatLog = new ChatLog((c) => this.windows.openCharacter(c));
    host.appendChild(this.eventLog.root);
    host.appendChild(this.chatLog.root);

    const style = new TextStyle({
      fontSize: 16,
      fill: ColorConfig.TEXT,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 3 },
    });
    this.clock = new Text({ text: this.time.format(), style });
    this.clock.x = 8;
    this.clock.y = 8;
    this.app.stage.addChild(this.clock);
  }

  private wireBus(): void {
    this.bus.onWorld((e) => {
      this.eventLog.push(e.stamp, e.text, e.category, e.related);
    });
    this.bus.onChat((e) => {
      this.chatLog.push(e.stamp, e.message, e.speaker);
    });
    this.bus.onFx((e) => {
      switch (e.kind) {
        case FxKind.Damage:
          this.effectLayer.spawnDamage(e.x, e.y, e.amount);
          break;
        case FxKind.Heal:
          this.effectLayer.spawnHeal(e.x, e.y, e.amount);
          break;
        case FxKind.Buff:
          this.effectLayer.spawnBuff(e.x, e.y);
          break;
        case FxKind.Debuff:
          this.effectLayer.spawnDebuff(e.x, e.y);
          break;
      }
    });
  }

  private setupToolbar(host: HTMLElement): void {
    const bar = document.createElement('div');
    bar.style.position = 'absolute';
    bar.style.top = '8px';
    bar.style.left = '50%';
    bar.style.transform = 'translateX(-50%)';
    bar.style.display = 'flex';
    bar.style.gap = '6px';
    bar.style.zIndex = '600';

    const mkBtn = (label: string, cb: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.background = '#2a2a3a';
      b.style.color = '#e8e8e8';
      b.style.border = '1px solid #50506a';
      b.style.borderRadius = '4px';
      b.style.padding = '4px 10px';
      b.style.cursor = 'pointer';
      b.addEventListener('click', cb);
      return b;
    };

    bar.appendChild(mkBtn('⏸ 停止', () => this.time.setSpeed(TimeConfig.SPEED_PAUSE)));
    bar.appendChild(mkBtn('▶ 再生', () => this.time.setSpeed(TimeConfig.SPEED_NORMAL)));
    bar.appendChild(mkBtn('⏩ 2倍速', () => this.time.setSpeed(TimeConfig.SPEED_FAST)));
    host.appendChild(bar);
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => this.keyDown.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keyDown.delete(e.key.toLowerCase()));

    const canvas = this.app.canvas;
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? CameraConfig.ZOOM_STEP : 1 / CameraConfig.ZOOM_STEP;
        this.camera.zoomAt(factor, e.offsetX, e.offsetY);
        this.followTarget = null;
      },
      { passive: false },
    );
    canvas.addEventListener('pointerdown', (e) => {
      if (e.ctrlKey) {
        this.ctrlDragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (this.ctrlDragging) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.camera.pan(dx, dy);
        this.followTarget = null;
      }
    });
    window.addEventListener('pointerup', () => {
      this.ctrlDragging = false;
    });
  }

  public setFollow(target: Character | null): void {
    this.followTarget = target;
  }

  public focusOn(x: number, y: number): void {
    this.camera.focus(x, y);
    this.followTarget = null;
  }

  private handleKeyboardPan(dtSec: number): void {
    let dx = 0;
    let dy = 0;
    const speed = (CameraConfig.MOVE_SPEED * dtSec) / this.camera.getZoom();
    if (this.keyDown.has('w')) dy -= speed;
    if (this.keyDown.has('s')) dy += speed;
    if (this.keyDown.has('a')) dx -= speed;
    if (this.keyDown.has('d')) dx += speed;
    if (dx !== 0 || dy !== 0) {
      this.camera.moveWorld(dx, dy);
      this.followTarget = null;
    }
  }

  private onTick(): void {
    const deltaMs = this.app.ticker.deltaMS;
    const dtSec = deltaMs * SECONDS_PER_MS;
    this.handleKeyboardPan(dtSec);

    const elapsedHours = this.time.advance(deltaMs);
    if (elapsedHours > 0) {
      this.clock.text = this.time.format();
      this.recovery.update(elapsedHours);
      this.respawn.update();
      this.relations.update();
      this.bandits.update();
      this.mating.update();
      this.dialogue.update();
      this.updateDeathTimers(elapsedHours);
      this.syncViews();
      this.refreshForts();
    }

    if (this.time.getSpeed() !== TimeConfig.SPEED_PAUSE) {
      this.updateAgents(dtSec);
    }

    for (const view of this.charViews.values()) {
      view.update(dtSec);
    }
    this.effectLayer.update(dtSec);

    if (this.followTarget && !this.followTarget.isDead()) {
      this.camera.focus(this.followTarget.x, this.followTarget.y);
    }
  }

  private updateDeathTimers(elapsedHours: number): void {
    const toRemove: Character[] = [];
    for (const c of this.world.characters.values()) {
      if (c.isDead()) {
        c.deathTimer += elapsedHours;
        if (c.deathTimer >= RenderConfig.DEATH_GRAYSCALE_HOURS) {
          toRemove.push(c);
        }
      }
    }
    for (const c of toRemove) {
      this.relations.store.removeEntity(c.id);
      this.world.removeCharacter(c);
    }
  }

  private buildAgentState(c: Character): AgentState {
    const enemies = this.world.grid.queryRadius(c.x, c.y, CombatConfig.PERCEPTION_RANGE);
    let nearEnemy = false;
    let nearAlly = false;
    let nearTarget = false;
    for (const o of enemies) {
      if (o.id === c.id || o.isDead()) {
        continue;
      }
      if (o.kind === EntityKind.Monster || o.kind === EntityKind.Boss) {
        nearEnemy = true;
      } else if (o.kind === EntityKind.Npc) {
        if (c.isEvil && !o.isEvil) {
          nearTarget = true;
        }
        if (o.isEvil === c.isEvil) {
          nearAlly = true;
        }
        if (this.relations.store.get(c.id, o.id) <= -1) {
          nearEnemy = true;
        }
      }
    }
    return {
      hasFood: c.inventory.food > DesireConfig.HUNGER_FOOD_THRESHOLD,
      lowHp: c.hp < c.hpMax * 0.4,
      lowHealth: c.health < StatsConfig.HEALTH_DEBUFF_THRESHOLD,
      hasMoney: c.inventory.money > 0,
      hasValuables: c.inventory.valuables > 0,
      nearEnemy,
      nearCity: this.nearCity(c),
      nearAlly,
      nearTarget,
      isEvil: c.isEvil,
    };
  }

  private nearCity(c: Character): boolean {
    for (const city of this.world.cities) {
      const dx = city.x - c.x;
      const dy = city.y - c.y;
      if (dx * dx + dy * dy < RenderConfig.CITY_RADIUS * RenderConfig.CITY_RADIUS * 9) {
        return true;
      }
    }
    return false;
  }

  private updateAgents(dtSec: number): void {
    const speedScale = this.time.getSpeed();
    for (const c of this.world.characters.values()) {
      if (c.isDead()) {
        continue;
      }
      if (c.kind === EntityKind.Npc) {
        this.driveNpc(c, dtSec, speedScale);
      } else {
        this.driveMonster(c, dtSec, speedScale);
      }
    }
  }

  private driveNpc(c: Character, dtSec: number, speedScale: number): void {
    const state = this.buildAgentState(c);
    const goal = this.planner.selectGoal(state, { isEvil: c.isEvil });
    const plan = this.planner.plan(state, goal);
    const action = plan.length > 0 ? plan[0].name : ActionName.Wander;
    this.executeNpcAction(c, action, dtSec, speedScale);
  }

  private executeNpcAction(
    c: Character,
    action: string,
    dtSec: number,
    speedScale: number,
  ): void {
    switch (action) {
      case ActionName.Hunt: {
        const enemy = this.nearestEnemy(c);
        if (enemy) {
          this.moveToward(c, enemy.x, enemy.y, dtSec, speedScale);
          this.combat.tryAttack(c, enemy);
        } else {
          this.wander(c, dtSec, speedScale);
        }
        break;
      }
      case ActionName.Rob: {
        const victim = this.nearestRobTarget(c);
        if (victim) {
          this.moveToward(c, victim.x, victim.y, dtSec, speedScale);
        } else {
          this.wander(c, dtSec, speedScale);
        }
        break;
      }
      case ActionName.Trade:
      case ActionName.Rest: {
        const city = this.nearestCityPos(c);
        if (this.reached(c, city.x, city.y)) {
          c.state = CharacterState.Resting;
        } else {
          this.moveToward(c, city.x, city.y, dtSec, speedScale);
        }
        break;
      }
      case ActionName.Socialize: {
        const ally = this.nearestAlly(c);
        if (ally) {
          this.moveToward(c, ally.x, ally.y, dtSec, speedScale);
          if (this.relations.store.classify(c.id, ally.id) === undefined) {
            break;
          }
          this.relations.growLove(c, ally);
        } else {
          this.wander(c, dtSec, speedScale);
        }
        break;
      }
      default:
        this.wander(c, dtSec, speedScale);
        break;
    }
  }

  private driveMonster(c: Character, dtSec: number, speedScale: number): void {
    if (c.isEvil) {
      const prey = this.nearestNpc(c);
      if (prey) {
        this.moveToward(c, prey.x, prey.y, dtSec, speedScale);
        this.combat.tryAttack(c, prey);
        return;
      }
    }
    const foe = this.nearestNpcInRange(c, CombatConfig.PERCEPTION_RANGE);
    if (foe) {
      this.moveToward(c, foe.x, foe.y, dtSec, speedScale);
      this.combat.tryAttack(c, foe);
      return;
    }
    this.wander(c, dtSec, speedScale);
  }

  private nearestEnemy(c: Character): Character | null {
    const near = this.world.grid.queryRadius(c.x, c.y, CombatConfig.PERCEPTION_RANGE);
    let best: Character | null = null;
    let bestD = Infinity;
    for (const o of near) {
      if (o.id === c.id || o.isDead()) {
        continue;
      }
      const isFoe =
        o.kind === EntityKind.Monster ||
        o.kind === EntityKind.Boss ||
        (o.kind === EntityKind.Npc && this.relations.store.get(c.id, o.id) <= -1);
      if (!isFoe) {
        continue;
      }
      const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  private nearestNpc(c: Character): Character | null {
    return this.nearestNpcInRange(c, CombatConfig.PERCEPTION_RANGE);
  }

  private nearestNpcInRange(c: Character, range: number): Character | null {
    const near = this.world.grid.queryRadius(c.x, c.y, range);
    let best: Character | null = null;
    let bestD = Infinity;
    for (const o of near) {
      if (o.id === c.id || o.kind !== EntityKind.Npc || o.isDead()) {
        continue;
      }
      const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  private nearestRobTarget(c: Character): Character | null {
    const near = this.world.grid.queryRadius(c.x, c.y, CombatConfig.PERCEPTION_RANGE);
    let best: Character | null = null;
    let bestD = Infinity;
    for (const o of near) {
      if (o.id === c.id || o.kind !== EntityKind.Npc || o.isDead() || o.isEvil) {
        continue;
      }
      if (o.inventory.money <= 0) {
        continue;
      }
      const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  private nearestAlly(c: Character): Character | null {
    const near = this.world.grid.queryRadius(c.x, c.y, MatingConfig.MATE_RANGE * 3);
    let best: Character | null = null;
    let bestD = Infinity;
    for (const o of near) {
      if (o.id === c.id || o.kind !== EntityKind.Npc || o.isDead()) {
        continue;
      }
      if (o.isEvil !== c.isEvil) {
        continue;
      }
      const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  private nearestCityPos(c: Character): { x: number; y: number } {
    let best = { x: c.x, y: c.y };
    let bestD = Infinity;
    for (const city of this.world.cities) {
      const d = (city.x - c.x) ** 2 + (city.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { x: city.x, y: city.y };
      }
    }
    return best;
  }

  private moveToward(
    c: Character,
    tx: number,
    ty: number,
    dtSec: number,
    speedScale: number,
  ): void {
    const dx = tx - c.x;
    const dy = ty - c.y;
    const len = Math.hypot(dx, dy);
    if (len <= TARGET_REACH) {
      c.state = CharacterState.Idle;
      return;
    }
    const baseSpeed = MOVE_BASE_SPEED + c.attributes.agility * MOVE_AGILITY_SCALE;
    const step = baseSpeed * dtSec * speedScale;
    c.x += (dx / len) * step;
    c.y += (dy / len) * step;
    c.state = CharacterState.Moving;
    this.world.grid.update(c);
  }

  private wander(c: Character, dtSec: number, speedScale: number): void {
    if (this.reached(c, c.targetX, c.targetY)) {
      const radius = 300 + c.attributes.perception * 20;
      const angle = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(50, radius);
      const m = WorldConfig.EDGE_MARGIN;
      c.targetX = Math.max(m, Math.min(WorldConfig.WIDTH - m, c.x + Math.cos(angle) * r));
      c.targetY = Math.max(m, Math.min(WorldConfig.HEIGHT - m, c.y + Math.sin(angle) * r));
    }
    this.moveToward(c, c.targetX, c.targetY, dtSec, speedScale);
  }

  private reached(c: Character, x: number, y: number): boolean {
    return Math.hypot(x - c.x, y - c.y) < TARGET_REACH;
  }

  private syncViews(): void {
    for (const [id, view] of this.charViews) {
      if (!this.world.characters.has(id)) {
        view.destroy();
        this.charViews.delete(id);
      }
    }
    for (const c of this.world.characters.values()) {
      if (!this.charViews.has(c.id)) {
        this.addCharacterView(c);
      }
    }
    for (const cv of this.cityViews) {
      cv.refresh();
    }
  }

  private refreshForts(): void {
    for (const view of this.fortViews.values()) {
      view.refresh();
    }
  }
}