// 責務: ゲーム全体の統合。Pixiアプリ初期化・ワールド生成・システム駆動・
// 描画同期・UI連携・カメラ追従の中枢ループを担う。

import { Application, Container } from 'pixi.js';
import { CAMERA } from '../config/GameConfig';
import { GameClock } from '../core/GameClock';
import { World } from '../world/World';
import { Camera } from '../render/Camera';
import { TerrainRenderer } from '../render/TerrainRenderer';
import { RoadRenderer } from '../render/RoadRenderer';
import { CharacterSprite } from '../render/CharacterSprite';
import { CitySprite } from '../render/CitySprite';
import { SupplyPostSprite } from '../render/SupplyPostSprite';
import { EffectLayer } from '../render/EffectLayer';
import {
  ASSET_CONFIG,
  AssetResolver,
} from '../render/AssetResolver';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { RecoverySystem } from '../systems/RecoverySystem';
import { DeathSystem } from '../systems/DeathSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { EventLog } from '../logging/EventLog';
import { ConversationLog } from '../logging/ConversationLog';
import { EventLogPanel } from '../ui/EventLogPanel';
import { ConversationLogPanel } from '../ui/ConversationLogPanel';
import { TimeControlPanel } from '../ui/TimeControlPanel';
import { CharacterWindow } from '../ui/CharacterWindow';
import { CityWindow } from '../ui/CityWindow';

const WORLD_SEED = 20260629;

export class Game {
  private app!: Application;
  private world!: World;
  private clock!: GameClock;

  private worldLayer!: Container;
  private camera!: Camera;
  private terrainRenderer!: TerrainRenderer;
  private roadRenderer!: RoadRenderer;
  private effectLayer!: EffectLayer;
  private assets!: AssetResolver;

  private characterLayer!: Container;
  private cityLayer!: Container;
  private postLayer!: Container;

  private readonly charSprites: Map<number, CharacterSprite> = new Map();
  private readonly citySprites: Map<number, CitySprite> = new Map();

  private movement!: MovementSystem;
  private combat!: CombatSystem;
  private recovery!: RecoverySystem;
  private death!: DeathSystem;
  private spawn!: SpawnSystem;

  private eventLog!: EventLog;
  private conversationLog!: ConversationLog;
  private eventPanel!: EventLogPanel;
  private conversationPanel!: ConversationLogPanel;
  private timePanel!: TimeControlPanel;

  private uiRoot!: HTMLElement;

  /** 追従対象キャラID(選択中) */
  private followCharacterId: number | null = null;

  async start(mount: HTMLElement): Promise<void> {
    this.uiRoot = mount;

    this.app = new Application();
    await this.app.init({
      background: 0x101015,
      resizeTo: window,
      antialias: true,
    });
    mount.appendChild(this.app.canvas);

    this.clock = new GameClock();
    this.world = new World(WORLD_SEED);
    this.world.generate();

    this.assets = new AssetResolver();
    await this.assets.preload(ASSET_CONFIG);

    this.setupLayers();
    this.setupRenderers();
    this.setupSystems();
    this.setupUI();
    this.buildSprites();
    this.setupPicking();

    this.camera.resize(this.app.screen.width, this.app.screen.height);
    this.app.renderer.on('resize', (w: number, h: number) => {
      this.camera.resize(w, h);
    });

    this.app.ticker.add(() => this.tick());
  }

  private setupLayers(): void {
    this.worldLayer = new Container();
    this.app.stage.addChild(this.worldLayer);

    this.terrainRenderer = new TerrainRenderer();
    this.roadRenderer = new RoadRenderer();
    this.effectLayer = new EffectLayer();

    this.postLayer = new Container();
    this.cityLayer = new Container();
    this.characterLayer = new Container();

    this.worldLayer.addChild(this.terrainRenderer.container);
    this.worldLayer.addChild(this.roadRenderer.container);
    this.worldLayer.addChild(this.postLayer);
    this.worldLayer.addChild(this.cityLayer);
    this.worldLayer.addChild(this.characterLayer);
    this.worldLayer.addChild(this.effectLayer.container);

    this.camera = new Camera(this.worldLayer);
    this.camera.attachInput(this.app.canvas);
  }

  private setupRenderers(): void {
    this.terrainRenderer.render(this.world.terrain, this.assets);
    this.roadRenderer.render(this.world.roads);
  }

  private setupSystems(): void {
    this.eventLog = new EventLog();
    this.conversationLog = new ConversationLog();
    this.movement = new MovementSystem(this.world.rng);
    this.combat = new CombatSystem(this.world.rng, {
      effects: this.effectLayer,
      eventLog: this.eventLog,
      conversationLog: this.conversationLog,
      clock: this.clock,
    });
    this.recovery = new RecoverySystem();
    this.death = new DeathSystem();
    this.spawn = new SpawnSystem();
  }

  private setupUI(): void {
    this.timePanel = new TimeControlPanel(this.clock);
    this.timePanel.mount(this.uiRoot);

    this.eventPanel = new EventLogPanel(this.eventLog, (id) =>
      this.openCharacterById(id)
    );
    this.eventPanel.mount(this.uiRoot);

    this.conversationPanel = new ConversationLogPanel(
      this.conversationLog,
      (id) => this.openCharacterById(id)
    );
    this.conversationPanel.mount(this.uiRoot);
  }

  private buildSprites(): void {
    for (const post of this.world.supplyPosts) {
      const sp = new SupplyPostSprite(
        post,
        this.assets.get(ASSET_CONFIG.supplyPost)
      );
      this.postLayer.addChild(sp.container);
    }
    for (const city of this.world.cities) {
      const sp = new CitySprite(city, this.assets.get(ASSET_CONFIG.city));
      this.citySprites.set(city.id, sp);
      this.cityLayer.addChild(sp.container);
    }
    for (const c of this.world.characters) {
      this.addCharacterSprite(c.id);
    }
  }

  private addCharacterSprite(id: number): void {
    const c = this.world.findCharacter(id);
    if (!c) {
      return;
    }
    const tex =
      c.kind === 'npc'
        ? this.assets.get(ASSET_CONFIG.npc)
        : this.assets.get(ASSET_CONFIG.monster);
    const sprite = new CharacterSprite(c, tex);
    this.charSprites.set(id, sprite);
    this.characterLayer.addChild(sprite.container);
  }

  private setupPicking(): void {
    // キャラクター/都市のクリック判定(ワールド座標へ変換して最近傍)
    this.app.canvas.addEventListener('pointerdown', (e) => {
      if (e.ctrlKey) {
        return; // カメラドラッグ
      }
      const rect = this.app.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wp = this.camera.screenToWorld(sx, sy);
      this.handleWorldClick(wp.x, wp.y);
    });
  }

  private handleWorldClick(wx: number, wy: number): void {
    const cityHit = this.pickCity(wx, wy);
    if (cityHit !== null) {
      this.openCityById(cityHit);
      return;
    }
    const charHit = this.pickCharacter(wx, wy);
    if (charHit !== null) {
      this.openCharacterById(charHit);
    }
  }

  private pickCity(wx: number, wy: number): number | null {
    const radius = 48;
    let best: number | null = null;
    let bestDist = radius * radius;
    for (const city of this.world.cities) {
      const d = (city.x - wx) ** 2 + (city.y - wy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = city.id;
      }
    }
    return best;
  }

  private pickCharacter(wx: number, wy: number): number | null {
    const radius = 24;
    let best: number | null = null;
    let bestDist = radius * radius;
    for (const c of this.world.characters) {
      const d = (c.x - wx) ** 2 + (c.y - wy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = c.id;
      }
    }
    return best;
  }

  private openCharacterById(id: number): void {
    const c = this.world.findCharacter(id);
    if (!c) {
      return;
    }
    const win = new CharacterWindow(c);
    win.mount(this.uiRoot);
    // 選択するとカメラ追従(その後の操作で解除)
    this.followCharacterId = id;
    this.camera.centerOn(c.x, c.y);
    this.camera.consumeUserMoved();
  }

  private openCityById(id: number): void {
    const city = this.world.cities.find((c) => c.id === id);
    if (!city) {
      return;
    }
    const win = new CityWindow(city, this.world);
    win.mount(this.uiRoot);
  }

  private tick(): void {
    const realDtMs = this.app.ticker.deltaMS;
    const realDtSec = realDtMs / 1000;

    const gameDtMin = this.clock.advance(realDtSec);

    if (gameDtMin > 0) {
      this.world.rebuildGrid();
      this.movement.update(this.world, gameDtMin);
      this.combat.update(this.world, gameDtMin);
      this.recovery.update(this.world, gameDtMin);

      const created = this.spawn.update(this.world, gameDtMin);
      for (const id of created) {
        this.addCharacterSprite(id);
      }

      const removed = this.death.update(
        this.world,
        this.clock.getTotalMinutes()
      );
      for (const id of removed) {
        this.removeCharacterSprite(id);
      }
    }

    this.camera.update(realDtSec);
    this.handleFollow();

    this.syncSprites();
    this.effectLayer.update(realDtMs);

    this.timePanel.update();
    this.eventPanel.update();
    this.conversationPanel.update();
    this.refreshCityLabels();
  }

  private handleFollow(): void {
    if (this.followCharacterId === null) {
      this.camera.consumeUserMoved();
      return;
    }
    if (this.camera.consumeUserMoved()) {
      // ユーザーが操作したら追従解除
      this.followCharacterId = null;
      return;
    }
    const c = this.world.findCharacter(this.followCharacterId);
    if (c) {
      this.camera.centerOn(c.x, c.y);
    } else {
      this.followCharacterId = null;
    }
  }

  private syncSprites(): void {
    const total = this.clock.getTotalMinutes();
    for (const sprite of this.charSprites.values()) {
      sprite.update(total);
    }
  }

  private removeCharacterSprite(id: number): void {
    const sprite = this.charSprites.get(id);
    if (sprite) {
      sprite.destroy();
      this.charSprites.delete(id);
    }
  }

  private refreshCityLabels(): void {
    for (const sprite of this.citySprites.values()) {
      sprite.refresh();
    }
  }

  /** ズーム初期値の参照(将来のリセット用に保持) */
  get defaultZoom(): number {
    return CAMERA.DEFAULT_ZOOM;
  }
}