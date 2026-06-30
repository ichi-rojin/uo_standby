// 責務: カメラのズーム/パン制御とワールド座標変換、追従処理
import { Container } from 'pixi.js';
import { clamp } from '../util/math';
import { CAMERA, WORLD } from '../config/constants';

export class Camera {
  zoom = 0.15;
  x = WORLD.WIDTH / 2;
  y = WORLD.HEIGHT / 2;
  private followId: number | null = null;

  constructor(
    private readonly world: Container,
    private screenW: number,
    private screenH: number,
  ) {}

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  setFollow(id: number | null): void {
    this.followId = id;
  }

  clearFollow(): void {
    this.followId = null;
  }

  follow(x: number, y: number): void {
    if (this.followId === null) return;
    this.x = x;
    this.y = y;
  }

  isFollowing(): boolean {
    return this.followId !== null;
  }

  pan(dx: number, dy: number): void {
    this.x = clamp(this.x + dx / this.zoom, 0, WORLD.WIDTH);
    this.y = clamp(this.y + dy / this.zoom, 0, WORLD.HEIGHT);
  }

  zoomAt(factor: number): void {
    this.zoom = clamp(this.zoom * factor, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
  }

  apply(): void {
    this.world.scale.set(this.zoom);
    this.world.position.set(
      this.screenW / 2 - this.x * this.zoom,
      this.screenH / 2 - this.y * this.zoom,
    );
  }

  bounds(): { left: number; top: number; right: number; bottom: number } {
    const halfW = this.screenW / 2 / this.zoom;
    const halfH = this.screenH / 2 / this.zoom;
    return {
      left: this.x - halfW,
      top: this.y - halfH,
      right: this.x + halfW,
      bottom: this.y + halfH,
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.screenW / 2) / this.zoom + this.x,
      y: (sy - this.screenH / 2) / this.zoom + this.y,
    };
  }
}