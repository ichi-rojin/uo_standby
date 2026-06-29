// src/render/Camera.ts
// 責務: ワールド座標→スクリーン座標変換のためのカメラ（中心位置・ズーム）を保持し、入力で操作する。

import { CAMERA, WORLD } from '../config/constants';
import { clamp } from '../util/math';
import type { Vec2 } from '../domain/types';

export class Camera {
  centerX: number;
  centerY: number;
  zoom: number;
  private viewWidth: number;
  private viewHeight: number;

  constructor(viewWidth: number, viewHeight: number) {
    this.centerX = WORLD.WIDTH / 2;
    this.centerY = WORLD.HEIGHT / 2;
    this.zoom = CAMERA.DEFAULT_ZOOM;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  setViewSize(w: number, h: number): void {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  pan(dxWorld: number, dyWorld: number): void {
    this.centerX = clamp(this.centerX + dxWorld, 0, WORLD.WIDTH);
    this.centerY = clamp(this.centerY + dyWorld, 0, WORLD.HEIGHT);
  }

  zoomAt(screenX: number, screenY: number, factor: number): void {
    const before = this.screenToWorld(screenX, screenY);
    this.zoom = clamp(this.zoom * factor, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
    const after = this.screenToWorld(screenX, screenY);
    this.centerX += before.x - after.x;
    this.centerY += before.y - after.y;
    this.centerX = clamp(this.centerX, 0, WORLD.WIDTH);
    this.centerY = clamp(this.centerY, 0, WORLD.HEIGHT);
  }

  worldToScreen(world: Vec2): Vec2 {
    return {
      x: (world.x - this.centerX) * this.zoom + this.viewWidth / 2,
      y: (world.y - this.centerY) * this.zoom + this.viewHeight / 2,
    };
  }

  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: (sx - this.viewWidth / 2) / this.zoom + this.centerX,
      y: (sy - this.viewHeight / 2) / this.zoom + this.centerY,
    };
  }

  focusOn(world: Vec2): void {
    this.centerX = clamp(world.x, 0, WORLD.WIDTH);
    this.centerY = clamp(world.y, 0, WORLD.HEIGHT);
  }
}