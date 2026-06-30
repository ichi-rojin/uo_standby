// 責務: カメラ(パン・ズーム)状態と入力処理、追従
import { Container } from 'pixi.js';
import { CAMERA, WORLD } from '../config/constants';
import type { Vec2 } from '../core/Vec2';

export class Camera {
  zoom = 0.15;
  x = WORLD.WIDTH / 2;
  y = WORLD.HEIGHT / 2;
  private keys = new Set<string>();
  private dragging = false;
  private lastDrag: Vec2 | null = null;
  followId: number | null = null;
  private userMoved = false;

  constructor(private readonly stage: Container, private readonly canvas: HTMLCanvasElement) {
    this.bind();
  }

  private bind(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? CAMERA.ZOOM_STEP : 1 / CAMERA.ZOOM_STEP;
      this.zoom = Math.max(CAMERA.MIN_ZOOM, Math.min(CAMERA.MAX_ZOOM, this.zoom * factor));
      this.userMoved = true;
    }, { passive: false });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        this.dragging = true;
        this.lastDrag = { x: e.clientX, y: e.clientY };
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.dragging && this.lastDrag) {
        this.x -= (e.clientX - this.lastDrag.x) / this.zoom;
        this.y -= (e.clientY - this.lastDrag.y) / this.zoom;
        this.lastDrag = { x: e.clientX, y: e.clientY };
        this.userMoved = true;
      }
    });
    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.lastDrag = null;
    });
  }

  setFollow(id: number, pos: Vec2): void {
    this.followId = id;
    this.x = pos.x;
    this.y = pos.y;
    this.userMoved = false;
  }

  update(dt: number, followPos: Vec2 | null): void {
    const pan = CAMERA.PAN_SPEED * dt / this.zoom;
    let moved = false;
    if (this.keys.has('w')) { this.y -= pan; moved = true; }
    if (this.keys.has('s')) { this.y += pan; moved = true; }
    if (this.keys.has('a')) { this.x -= pan; moved = true; }
    if (this.keys.has('d')) { this.x += pan; moved = true; }
    if (moved) { this.userMoved = true; this.followId = null; }

    if (this.followId !== null && followPos && !this.userMoved) {
      this.x = followPos.x;
      this.y = followPos.y;
    }
    this.apply();
  }

  private apply(): void {
    this.stage.scale.set(this.zoom);
    this.stage.position.set(
      window.innerWidth / 2 - this.x * this.zoom,
      window.innerHeight / 2 - this.y * this.zoom
    );
  }

  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: (sx - window.innerWidth / 2) / this.zoom + this.x,
      y: (sy - window.innerHeight / 2) / this.zoom + this.y
    };
  }
}