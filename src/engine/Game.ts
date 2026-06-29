// src/engine/Game.ts
// 責務: ゲーム全体の統合点（第2便でGOAP/戦闘/感情/夜盗/交配/砦描画/会話/日次処理を統合）。

import { Application } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import { generateWorld } from '../world/WorldGenerator';
import { GameRenderer } from '../render/GameRenderer';
import { createSpriteFactory } from '../render/ProceduralTextures';
import { FortRenderer } from '../render/FortRenderer';
import { snapshotForts } from '../systems/FortRenderSupport';
import { UIManager } from '../ui/UIManager';
import { EventLog } from '../log/EventLog';
import { GameLoop } from './GameLoop';
import { SpawnSystem } from '../systems/SpawnSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { EffectSystem } from '../systems/EffectSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { AgentSystem } from '../systems/AgentSystem';
import { RecoverySystem } from '../systems/RecoverySystem';
import { BanditSystem } from '../systems/BanditSystem';
import { BreedingSystem } from '../systems/BreedingSystem';
import { RelationGraph } from '../social/RelationGraph';
import { Rng } from '../util/rng';
import { Camera } from '../render/Camera';
import { advanceHours, formatDate } from '../util/time';
import { CAMERA, RENDER_CONFIG_SEED, SPEED, TIME } from './gameConfigBridge';
import { RENDER_CONFIG } from '../config/renderConfig';
import { LifeState } from '../domain/enums';

interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  ctrl: boolean;
  dragging: boolean;
  lastX: number;
  lastY: number;
}

export class Game {
  private app!: Application;
  private world!: WorldState;
  private renderer!: GameRenderer;
  private fortRenderer!: FortRenderer;
  private ui!: UIManager;
  private readonly log: EventLog = new EventLog();
  private readonly relations: RelationGraph = new RelationGraph();
  private loop!: GameLoop;
  private readonly rng: Rng = new Rng(RENDER_CONFIG_SEED);
  private readonly spawn = new SpawnSystem();
  private readonly death = new DeathSystem();
  private readonly effects = new EffectSystem();
  private recovery!: RecoverySystem;
  private combat!: CombatSystem;
  private agents!: AgentSystem;
  private bandits!: BanditSystem;
  private breeding!: BreedingSystem;
  private dayAccumulator = 0;
  private lastProcessedDay = -1;
  private readonly input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    ctrl: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  async init(mount: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      background: RENDER_CONFIG.backgroundColor,
      antialias: true,
    });
    mount.appendChild(this.app.canvas);

    this.world = generateWorld(RENDER_CONFIG_SEED);
    const factory = await createSpriteFactory();

    this.renderer = new GameRenderer(
      this.app,
      this.world,
      factory,
      (id) => this.ui.openCharacterWindow(id),
      (id) => this.ui.openCityWindow(id),
    );

    this.fortRenderer = new FortRenderer();
    this.app.stage.addChildAt(this.fortRenderer.container, 0);

    const camera: Camera = this.renderer.camera;
    this.ui = new UIManager(mount, this.world, camera, this.log, (speed) =>
      this.loop.setSpeed(speed),
    );

    this.recovery = new RecoverySystem(this.log, this.rng);
    this.combat = new CombatSystem(this.effects, this.log, this.relations, this.rng);
    this.agents = new AgentSystem(this.combat, this.recovery, this.relations, this.log, this.rng);
    this.bandits = new BanditSystem(this.log, this.rng);
    this.breeding = new BreedingSystem(this.log, this.relations, this.rng);

    this.setupInput();

    this.loop = new GameLoop((dt) => this.update(dt));
    this.loop.setSpeed(SPEED.NORMAL);
    this.loop.start();

    window.addEventListener('resize', () => this.renderer.resize());
  }

  private setupInput(): void {
    const canvas = this.app.canvas;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? CAMERA.ZOOM_STEP : 1 / CAMERA.ZOOM_STEP;
      this.renderer.camera.zoomAt(e.offsetX, e.offsetY, factor);
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (this.input.ctrl) {
        this.input.dragging = true;
        this.input.lastX = e.clientX;
        this.input.lastY = e.clientY;
      }
    });
    window.addEventListener('pointerup', () => {
      this.input.dragging = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.input.dragging) return;
      const dx = e.clientX - this.input.lastX;
      const dy = e.clientY - this.input.lastY;
      this.input.lastX = e.clientX;
      this.input.lastY = e.clientY;
      const z = this.renderer.camera.zoom;
      this.renderer.camera.pan(-dx / z, -dy / z);
    });
  }

  private onKey(e: KeyboardEvent, pressed: boolean): void {
    switch (e.key.toLowerCase()) {
      case 'w':
        this.input.up = pressed;
        break;
      case 's':
        this.input.down = pressed;
        break;
      case 'a':
        this.input.left = pressed;
        break;
      case 'd':
        this.input.right = pressed;
        break;
      case 'control':
        this.input.ctrl = pressed;
        break;
      default:
        break;
    }
  }

  private updateCameraFromKeys(dt: number): void {
    const speed = (CAMERA.PAN_SPEED * dt) / this.renderer.camera.zoom;
    let dx = 0;
    let dy = 0;
    if (this.input.up) dy -= speed;
    if (this.input.down) dy += speed;
    if (this.input.left) dx -= speed;
    if (this.input.right) dx += speed;
    if (dx !== 0 || dy !== 0) {
      this.renderer.camera.pan(dx, dy);
    }
  }

  private advanceTime(dt: number): void {
    this.dayAccumulator += dt;
    const hoursPerSecond = TIME.HOURS_PER_DAY / TIME.REAL_SECONDS_PER_GAME_DAY;
    const hours = this.dayAccumulator * hoursPerSecond;
    if (hours >= 1) {
      const whole = Math.floor(hours);
      const prevDay = this.world.date.day;
      advanceHours(this.world.date, whole);
      this.dayAccumulator -= whole / hoursPerSecond;
      if (this.world.date.day !== prevDay) {
        this.runDailyProcesses();
      }
    }
  }

  private runDailyProcesses(): void {
    const dayKey = this.world.date.year * 10000 + this.world.date.month * 100 + this.world.date.day;
    if (dayKey === this.lastProcessedDay) return;
    this.lastProcessedDay = dayKey;
    this.recovery.applyFieldRecoveryAndStarvation(this.world);
    this.bandits.processDaily(this.world);
    this.breeding.processDaily(this.world);
    this.relations.decay();
    this.cleanupRelationsForDead();
  }

  private cleanupRelationsForDead(): void {
    for (const c of this.world.characters.values()) {
      if (c.state === LifeState.Dead && c.deadTimer <= 0.1) {
        this.relations.removeEntity(c.id);
      }
    }
  }

  private update(dt: number): void {
    this.updateCameraFromKeys(dt);
    if (dt > 0) {
      this.advanceTime(dt);
      this.agents.update(this.world, dt);
      this.spawn.update(this.world, this.rng, dt);
      this.death.update(this.world, dt);
      this.effects.update(this.world, dt);
    }
    this.fortRenderer.update(snapshotForts(this.world));
    this.ui.timePanel.setDateText(formatDate(this.world.date));
    this.renderer.render(this.world);
  }
}