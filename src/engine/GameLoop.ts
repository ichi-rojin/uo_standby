// src/engine/GameLoop.ts
// 責務: 固定的なデルタタイム供給と速度倍率（停止/通常/2倍）の適用ループを提供する。

export type UpdateCallback = (dtSeconds: number) => void;

export class GameLoop {
  private lastTime = 0;
  private running = false;
  private speedMultiplier = 1;
  private readonly callback: UpdateCallback;

  constructor(callback: UpdateCallback) {
    this.callback = callback;
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const clamped = Math.min(rawDt, 0.1);
    this.callback(clamped * this.speedMultiplier);
    requestAnimationFrame(this.tick);
  };
}