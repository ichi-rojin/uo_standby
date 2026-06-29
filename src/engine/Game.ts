// src/engine/Game.ts
// 責務: ゲーム全体の統合点。ワールド生成・レンダラ・UI・システム群・入力・ループを結線し駆動する。

import { Application } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import { generateWorld } from '../world/WorldGenerator';
import { GameRenderer } from '../render/GameRenderer';
import { createSpriteFactory } from '../render/ProceduralTextures';
import { UIManager } from '../ui/UIManager';
import { EventLog } from '../log/EventLog';
import { GameLoop } from './GameLoop';
import { MovementSystem } from '../systems/MovementSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { EffectSystem } from '../systems/EffectSystem';
import { Rng } from '../util/rng';
import { Camera } from '../render/Camera';
import { advanceHours, formatDate } from '../util/time';
import { CAMERA, RENDER_CONFIG_SEED, SPEED, TIME } from './gameConfigBridge';
import { RENDER_CONFIG } from '../config/renderConfig';

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
  private ui!: UIManager;
  private readonly log: EventLog = new EventLog();
  private loop!: GameLoop;
  private readonly rng: Rng = new Rng(RENDER_CONFIG_SEED);
  private readonly movement = new MovementSystem();
  private readonly spawn = new SpawnSystem();
  private readonly death = new DeathSystem();
  private readonly effects = new EffectSystem();
  private dayAccumulator = 0;
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

    const camera: Camera = this.renderer.camera;
    this.ui = new UIManager(mount, this.world, camera, this.log, (speed) =>
      this.loop.setSpeed(speed),
    );

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
      advanceHours(this.world.date, whole);
      this.dayAccumulator -= whole / hoursPerSecond;
    }
  }

  private update(dt: number): void {
    this.updateCameraFromKeys(dt);
    if (dt > 0) {
      this.advanceTime(dt);
      this.movement.update(this.world, this.rng, dt);
      this.spawn.update(this.world, this.rng, dt);
      this.death.update(this.world, dt);
      this.effects.update(this.world, dt);
    }
    this.ui.timePanel.setDateText(formatDate(this.world.date));
    this.renderer.render(this.world);
  }
}