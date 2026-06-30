// File: src/render/Camera.ts
// 責務: ワールドコンテナのカメラ制御。ホイール拡縮・WASD/Ctrlドラッグ移動・追従。

import { Container } from 'pixi.js';
import { CameraConfig, WorldConfig } from '../config/GameConfig';

export class Camera {
  private zoom: number;
  private centerX: number;
  private centerY: number;
  private viewW: number;
  private viewH: number;

  constructor(
    private readonly world: Container,
    viewW: number,
    viewH: number,
  ) {
    this.zoom = CameraConfig.START_ZOOM;
    this.centerX = WorldConfig.WIDTH / 2;
    this.centerY = WorldConfig.HEIGHT / 2;
    this.viewW = viewW;
    this.viewH = viewH;
    this.apply();
  }

  public resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
    this.apply();
  }

  public zoomAt(factor: number, screenX: number, screenY: number): void {
    const worldBefore = this.screenToWorld(screenX, screenY);
    let nz = this.zoom * factor;
    if (nz < CameraConfig.MIN_ZOOM) nz = CameraConfig.MIN_ZOOM;
    if (nz > CameraConfig.MAX_ZOOM) nz = CameraConfig.MAX_ZOOM;
    this.zoom = nz;
    this.apply();
    const worldAfter = this.screenToWorld(screenX, screenY);
    this.centerX += worldBefore.x - worldAfter.x;
    this.centerY += worldBefore.y - worldAfter.y;
    this.apply();
  }

  public pan(dxScreen: number, dyScreen: number): void {
    this.centerX -= dxScreen / this.zoom;
    this.centerY -= dyScreen / this.zoom;
    this.apply();
  }

  public moveWorld(dxWorld: number, dyWorld: number): void {
    this.centerX += dxWorld;
    this.centerY += dyWorld;
    this.apply();
  }

  public focus(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.apply();
  }

  public getZoom(): number {
    return this.zoom;
  }

  public screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.viewW / 2) / this.zoom + this.centerX,
      y: (sy - this.viewH / 2) / this.zoom + this.centerY,
    };
  }

  private apply(): void {
    this.world.scale.set(this.zoom);
    this.world.x = this.viewW / 2 - this.centerX * this.zoom;
    this.world.y = this.viewH / 2 - this.centerY * this.zoom;
  }
}