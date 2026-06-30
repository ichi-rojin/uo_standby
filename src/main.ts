// File: src/main.ts
// 責務: エントリポイント。ホスト要素を取得しゲームを起動する。

import { Game } from './game/Game';

const host = document.getElementById('app');
if (!host) {
  throw new Error('app host element not found');
}

const game = new Game();
void game.start(host);