// src/main.ts
// 責務: アプリのエントリポイント。マウント要素を取得し Game を初期化する。

import { Game } from './engine/Game';

async function bootstrap(): Promise<void> {
  const mount = document.getElementById('app');
  if (!mount) {
    throw new Error('mount element #app not found');
  }
  const game = new Game();
  await game.init(mount);
}

void bootstrap();