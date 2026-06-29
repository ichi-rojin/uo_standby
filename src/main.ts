// 責務: エントリポイント。DOMマウント先を取得しGameを起動する。

import { Game } from './game/Game';

const mount = document.getElementById('app');
if (!mount) {
  throw new Error('#app element not found');
}

const game = new Game();
void game.start(mount);