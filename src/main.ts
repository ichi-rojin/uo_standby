// 責務: アプリ起動・ループ統合・入力ルーティング(エントリポイント)
import { Application, Graphics } from 'pixi.js';
import { Simulation } from './sim/Simulation';
import { Renderer } from './render/Renderer';
import { Camera } from './render/Camera';
import { WindowManager } from './ui/Windows';
import { LogPanel } from './ui/LogPanel';
import { Toolbar } from './ui/Toolbar';
import type { SpeedMode } from './ui/Toolbar';
import { preloadExternal } from './render/Sprites';
import { TIME, WORLD, COLORS } from './config/constants';

async function boot(): Promise<void> {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('app element missing');

  const app = new Application();
  await app.init({
    background: COLORS.GROUND,
    resizeTo: window,
    antialias: true
  });
  appEl.appendChild(app.canvas);
  await preloadExternal();

  const sim = new Simulation(20240630);
  const renderer = new Renderer(app, sim);

  // 地面背景
  const ground = new Graphics();
  ground.rect(0, 0, WORLD.WIDTH, WORLD.HEIGHT).fill(COLORS.GROUND);
  renderer.world.addChildAt(ground, 0);

  const camera = new Camera(renderer.world, app.canvas);

  let speed: SpeedMode = 1;
  const toolbar = new Toolbar(document.body, (m) => {
    speed = m;
  });

  const windows = new WindowManager(document.body, sim, (id) => {
    const c = sim.chars.get(id);
    if (c) camera.setFollow(id, c.pos);
  });

  const logPanel = new LogPanel(document.body, sim.log, (id) => windows.openCharacter(id));
  void logPanel;

  app.canvas.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const w = camera.screenToWorld(e.clientX, e.clientY);
    const charId = renderer.hitTestChar(w.x, w.y);
    if (charId !== null) {
      windows.openCharacter(charId);
      return;
    }
    const cityId = renderer.hitTestCity(w.x, w.y);
    if (cityId !== null) windows.openCity(cityId);
  });

  let last = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    const dtReal = Math.min(0.05, (now - last) / 1000);
    last = now;
    const factor = speed === 0 ? 0 : speed === 2 ? 2 : 1;
    if (factor > 0) {
      const dtGameMin = dtReal * factor * TIME.GAME_MINUTES_PER_SECOND;
      sim.update(dtGameMin, dtReal * factor);
    }
    const followChar = camera.followId !== null ? sim.chars.get(camera.followId) : undefined;
    camera.update(dtReal, followChar ? followChar.pos : null);
    renderer.sync();
    toolbar.setClock(sim.clock.format());
  });
}

void boot();