// 責務: カメラのズーム/移動(ホイール・WASD・Ctrl+ドラッグ)
import { Container } from 'pixi.js';
import { CAMERA, WORLD } from '../config/constants';

export class CameraController {
  private stage: Container;
  private zoom = 0.2;
  private keys = new Set<string>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private viewW: number;
  private viewH: number;
  follow: { pos: { x: number; y: number } } | null = null;
  onManualMove: (() => void) | null = null;

  constructor(stage: Container, viewW: number, viewH: number) {
    this.stage = stage;
    this.viewW = viewW;
    this.viewH = viewH;
    this.center(WORLD.WIDTH / 2, WORLD.HEIGHT / 2);
    this.attach();
  }

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  private attach(): void {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('wheel', (e) => {
      const factor = e.deltaY < 0 ? CAMERA.ZOOM_STEP : 1 / CAMERA.ZOOM_STEP;
      this.zoom = Math.max(CAMERA.MIN_ZOOM, Math.min(CAMERA.MAX_ZOOM, this.zoom * factor));
    }, { passive: true });
    window.addEventListener('mousedown', (e) => {
      if (e.ctrlKey) { this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY; }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        const dx = (e.clientX - this.lastX) / this.zoom;
        const dy = (e.clientY - this.lastY) / this.zoom;
        this.lastX = e.clientX; this.lastY = e.clientY;
        this.stage.pivot.x -= dx;
        this.stage.pivot.y -= dy;
        this.follow = null;
        if (this.onManualMove) this.onManualMove();
      }
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });
  }

  private center(x: number, y: number): void {
    this.stage.pivot.set(x, y);
  }

  setFollow(target: { pos: { x: number; y: number } }): void {
    this.follow = target;
  }

  jumpTo(x: number, y: number): void {
    this.center(x, y);
  }

  update(): void {
    let moved = false;
    if (this.keys.has('w')) { this.stage.pivot.y -= CAMERA.MOVE_SPEED / this.zoom; moved = true; }
    if (this.keys.has('s')) { this.stage.pivot.y += CAMERA.MOVE_SPEED / this.zoom; moved = true; }
    if (this.keys.has('a')) { this.stage.pivot.x -= CAMERA.MOVE_SPEED / this.zoom; moved = true; }
    if (this.keys.has('d')) { this.stage.pivot.x += CAMERA.MOVE_SPEED / this.zoom; moved = true; }
    if (moved) { this.follow = null; if (this.onManualMove) this.onManualMove(); }
    if (this.follow) this.center(this.follow.pos.x, this.follow.pos.y);
    this.stage.scale.set(this.zoom);
    this.stage.position.set(this.viewW / 2, this.viewH / 2);
  }
}