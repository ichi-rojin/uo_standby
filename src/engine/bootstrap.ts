// 責務: 初期ワールド生成とNPC初期配置でGameStateを構築
import { Rng } from '../util/rng';
import { COUNTS } from '../config/constants';
import { generateWorld } from '../world/worldGen';
import { createCharacter, resetIdCounter } from '../factory/characterFactory';
import { GameState } from '../state/gameState';

export function bootstrap(seed: number): GameState {
  resetIdCounter();
  const rng = new Rng(seed);
  const state = new GameState();
  const world = generateWorld(rng);
  state.cities = world.cities;
  state.villages = world.villages;
  state.roads = world.roads;
  state.dungeons = world.dungeons;
  state.bosses = world.bosses;
  state.forts = world.forts;

  for (const bc of world.bossChars) {
    state.characters.set(bc.id, bc);
  }

  const initialNpc = COUNTS.NPC_MIN + 40;
  for (let i = 0; i < initialNpc; i++) {
    const city = rng.pick(state.cities);
    const npc = createCharacter(rng, 'npc', city.x, city.y, null, city.id);
    state.characters.set(npc.id, npc);
    city.residents.push(npc.id);
  }

  const initialMonsters = COUNTS.MONSTER_MIN + 50;
  let placed = 0;
  let guard = 0;
  while (placed < initialMonsters && guard < initialMonsters * 10) {
    guard++;
    const m = createCharacter(
      rng,
      'monster',
      rng.range(400, 7600),
      rng.range(400, 7600),
      null,
      null,
    );
    state.characters.set(m.id, m);
    placed++;
  }

  return state;
}