// 責務: アプリ起動エントリ(PixiJS初期化 → Game起動)
import { Application } from 'pixi.js';
import { Game } from './game/game';

async function bootstrap(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('app root not found');

  const app = new Application();
  await app.init({
    background: 0x101018,
    resizeTo: window,
    antialias: true
  });
  root.appendChild(app.canvas);

  const game = new Game(app, root);
  game.init();
}

void bootstrap();