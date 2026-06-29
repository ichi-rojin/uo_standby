// src/render/GameRenderer.ts
// 責務: PixiJS Application のレイヤ構成（ワールドコンテナ＋各レンダラ）を統括し、カメラ変換を適用する。

import { Application, Container } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import { Camera } from './Camera';
import { MapRenderer } from './MapRenderer';
import { CityRenderer } from './CityRenderer';
import type { CityClickHandler } from './CityRenderer';
import { CharacterRenderer } from './CharacterRenderer';
import type { CharacterClickHandler } from './CharacterRenderer';
import { EffectRenderer } from './EffectRenderer';
import type { SpriteFactory } from './ProceduralTextures';

export class GameRenderer {
  readonly app: Application;
  readonly camera: Camera;
  private readonly worldContainer: Container;
  private readonly characterRenderer: CharacterRenderer;
  private readonly cityRenderer: CityRenderer;
  private readonly effectRenderer: EffectRenderer;

  constructor(
    app: Application,
    world: WorldState,
    factory: SpriteFactory,
    onCharacterClick: CharacterClickHandler,
    onCityClick: CityClickHandler,
  ) {
    this.app = app;
    this.camera = new Camera(app.screen.width, app.screen.height);
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    const mapRenderer = new MapRenderer(world);
    this.worldContainer.addChild(mapRenderer.container);

    this.cityRenderer = new CityRenderer(world, factory, onCityClick);
    this.worldContainer.addChild(this.cityRenderer.container);

    this.characterRenderer = new CharacterRenderer(onCharacterClick);
    this.worldContainer.addChild(this.characterRenderer.container);

    this.effectRenderer = new EffectRenderer();
    this.worldContainer.addChild(this.effectRenderer.container);
  }

  applyCamera(): void {
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.x = this.app.screen.width / 2 - this.camera.centerX * this.camera.zoom;
    this.worldContainer.y = this.app.screen.height / 2 - this.camera.centerY * this.camera.zoom;
  }

  render(world: WorldState): void {
    this.cityRenderer.update(world);
    this.characterRenderer.update(world);
    this.effectRenderer.update(world);
    this.applyCamera();
  }

  resize(): void {
    this.camera.setViewSize(this.app.screen.width, this.app.screen.height);
  }
}