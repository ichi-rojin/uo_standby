// 責務: ワールド→画面変換、ズーム/パン、入力(ホイール/WASD/Ctrl+ドラッグ)処理。

import { Container } from 'pixi.js';
import { CAMERA, WORLD } from '../config/GameConfig';

export class Camera {
  /** ワールド座標(画面中心が指すワールド点) */
  x: number;
  y: number;
  zoom: number;

  private readonly worldLayer: Container;
  private screenWidth = 0;
  private screenHeight = 0;

  private keys: Set<string> = new Set();
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  /** ユーザー操作があったフレーム判定(追従解除用) */
  private userMoved = false;

  constructor(worldLayer: Container) {
    this.worldLayer = worldLayer;
    this.x = (WORLD.WIDTH_TILES * WORLD.TILE_SIZE) / 2;
    this.y = (WORLD.HEIGHT_TILES * WORLD.TILE_SIZE) / 2;
    this.zoom = CAMERA.DEFAULT_ZOOM;
  }

  resize(w: number, h: number): void {
    this.screenWidth = w;
    this.screenHeight = h;
  }

  attachInput(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor =
          e.deltaY < 0 ? CAMERA.ZOOM_STEP : 1 / CAMERA.ZOOM_STEP;
        this.zoom = this.clampZoom(this.zoom * factor);
        this.userMoved = true;
      },
      { passive: false }
    );

    canvas.addEventListener('pointerdown', (e) => {
      if (e.ctrlKey) {
        this.dragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (this.dragging) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
        this.userMoved = true;
      }
    });
    window.addEventListener('pointerup', () => {
      this.dragging = false;
    });
  }

  /** 実時間dt(秒)でWASDパンを処理 */
  update(realDt: number): void {
    let mvx = 0;
    let mvy = 0;
    if (this.keys.has('w')) {
      mvy -= 1;
    }
    if (this.keys.has('s')) {
      mvy += 1;
    }
    if (this.keys.has('a')) {
      mvx -= 1;
    }
    if (this.keys.has('d')) {
      mvx += 1;
    }
    if (mvx !== 0 || mvy !== 0) {
      const len = Math.hypot(mvx, mvy);
      this.x += (mvx / len) * CAMERA.PAN_SPEED * realDt;
      this.y += (mvy / len) * CAMERA.PAN_SPEED * realDt;
      this.userMoved = true;
    }
    this.applyTransform();
  }

  /** カメラを指定ワールド座標へ移動 */
  centerOn(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /** ユーザー操作があったか確認しフラグをリセット */
  consumeUserMoved(): boolean {
    const v = this.userMoved;
    this.userMoved = false;
    return v;
  }

  /** スクリーン座標→ワールド座標 */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.screenWidth / 2) / this.zoom + this.x,
      y: (sy - this.screenHeight / 2) / this.zoom + this.y,
    };
  }

  private applyTransform(): void {
    this.worldLayer.scale.set(this.zoom);
    this.worldLayer.position.set(
      this.screenWidth / 2 - this.x * this.zoom,
      this.screenHeight / 2 - this.y * this.zoom
    );
  }

  private clampZoom(z: number): number {
    return Math.min(CAMERA.MAX_ZOOM, Math.max(CAMERA.MIN_ZOOM, z));
  }
}