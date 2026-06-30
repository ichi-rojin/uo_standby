// 責務: ワールド状態保持・エンティティ更新統括・リスポーン管理
import { Rng } from '../core/Rng';
import { SpatialGrid } from '../core/SpatialGrid';
import { dist, distSq, moveToward } from '../core/Vec2';
import type { Vec2 } from '../core/Vec2';
import { WORLD, COUNTS, AI, COMBAT, STATS, RENDER, TIME } from '../config/constants';
import type { Character, City } from '../domain/types';
import { GameClock } from '../domain/GameClock';
import { createNpc, createMonster } from '../domain/Factory';
import { generateWorld, triangleSpawn } from '../world/WorldGen';
import type { GeneratedWorld } from '../world/WorldGen';
import { EventLog } from './EventLog';
import { adjustRelation } from './Relations';
import { greetPhrase, huntPhrase, deathPhrase, monsterCry, magicPhrase, specialPhrase } from '../domain/Phrases';
import { computeTitle } from '../domain/Titles';
import { GOAP, FORT, EMOTION } from '../config/constants';
import { plan } from '../ai/Goap';
import type { GoapAction } from '../ai/Goap';
import { FortSystem } from './Forts';

export class Simulation {
  readonly rng: Rng;
  readonly clock = new GameClock();
  readonly log = new EventLog();
  readonly world: GeneratedWorld;
  readonly chars: Map<number, Character> = new Map();
  readonly forts: FortSystem;
  private grid: SpatialGrid<Character>;
  private nextId = 1;
  private fortSeq: number;

  constructor(seed: number) {
    this.rng = new Rng(seed);
    this.world = generateWorld(this.rng);
    this.forts = new FortSystem(this.world.forts, this.rng);
    this.grid = new SpatialGrid<Character>(WORLD.WIDTH, WORLD.HEIGHT, WORLD.CELL_SIZE);
    this.seedPopulation();
  }

  private list(): Character[] {
    return [...this.chars.values()];
  }

  private aliveList(): Character[] {
    return this.list().filter((c) => c.alive);
  }

  private seedPopulation(): void {
    for (let i = 0; i < COUNTS.NPC_MIN + 40; i++) this.spawnNpc();
    for (let i = 0; i < COUNTS.MONSTER_MIN + 60; i++) this.spawnMonster();
  }

  private freeSpawnPos(): Vec2 {
    for (let i = 0; i < 20; i++) {
      const p = triangleSpawn(this.rng, this.world);
      const near = this.grid.queryRadius(p, 120);
      if (near.length === 0) return p;
    }
    return triangleSpawn(this.rng, this.world);
  }

  spawnNpc(forceEvil = false): void {
    const city = this.rng.pick(this.world.cities);
    const pos = this.freeSpawnPos();
    const c = createNpc(this.rng, this.nextId++, pos, city.id, forceEvil);
    this.chars.set(c.id, c);
    this.addHistory(c, `${c.surname}・${c.givenName}として誕生した`);
  }

  spawnMonster(): void {
    const pos = this.freeSpawnPos();
    const c = createMonster(this.rng, this.nextId++, pos, false);
    this.chars.set(c.id, c);
  }

  private addHistory(c: Character, text: string): void {
    c.history.unshift({ stamp: this.clock.stamp(), text });
    if (c.history.length > 60) c.history.pop();
  }

  private countNpc(): number {
    let n = 0;
    for (const c of this.chars.values()) if (c.alive && c.kind === 'npc') n++;
    return n;
  }
  private countMonster(): number {
    let n = 0;
    for (const c of this.chars.values()) if (c.alive && c.kind !== 'npc') n++;
    return n;
  }

  // 効果通知(描画用エフェクトはRendererがpollする)
  effects: { x: number; y: number; type: 'damage' | 'heal' | 'buff' | 'debuff'; t: number }[] = [];

  private addEffect(p: Vec2, type: 'damage' | 'heal' | 'buff' | 'debuff'): void {
    this.effects.push({ x: p.x, y: p.y, type, t: 0 });
  }

  update(dtGameMin: number, dtReal: number): void {
    this.clock.advance(dtGameMin);
    this.grid.rebuild(this.aliveList());

    const now = this.clock.minutes;
    for (const c of this.chars.values()) {
      if (!c.alive) {
        if (now - c.deadSince > RENDER.DEAD_GRAYSCALE_SECONDS * (TIME.GAME_MINUTES_PER_SECOND)) {
          // グレースケール表示期間終了で削除
          this.chars.delete(c.id);
        }
        continue;
      }
      this.updateChar(c, dtReal);
    }

    // エフェクト寿命
    for (const e of this.effects) e.t += dtReal;
    this.effects = this.effects.filter((e) => e.t < 0.8);

    this.maintainPopulation();
    this.maintainChildren();
    this.maintainForts();
  }

  private maintainChildren(): void {
    const now = this.clock.minutes;
    const matureMin = TIME.CHILD_MATURE_YEARS * 12 * 30 * 24 * 60;
    for (const city of this.world.cities) {
      const ready = city.storedChildren.filter((ch) => now - ch.bornAt >= matureMin);
      if (ready.length > 0 && this.countNpc() < COUNTS.NPC_MAX) {
        city.storedChildren = city.storedChildren.filter((ch) => now - ch.bornAt < matureMin);
        for (const _ of ready) {
          if (this.countNpc() >= COUNTS.NPC_MAX) break;
          this.spawnNpc();
        }
      }
    }
  }

  private maintainPopulation(): void {
    if (this.countNpc() < COUNTS.NPC_MIN) this.spawnNpc();
    if (this.countMonster() < COUNTS.MONSTER_MIN) this.spawnMonster();
  }

  private nearestCity(p: Vec2): City {
    let best = this.world.cities[0];
    let bestD = Infinity;
    for (const c of this.world.cities) {
      const d = distSq(p, c.pos);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private healAtRefuge(c: Character): boolean {
    const city = this.nearestCity(c.pos);
    if (dist(c.pos, city.pos) < RENDER.CITY_RADIUS + 30) {
      c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + 0.5);
      c.stats.mp = Math.min(c.stats.maxMp, c.stats.mp + 0.3);
      c.stats.health = Math.min(STATS.BASE_HEALTH, c.stats.health + 0.3);
      return true;
    }
    for (const v of this.world.villages) {
      if (dist(c.pos, v.pos) < RENDER.VILLAGE_RADIUS + 20) {
        c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + 0.3);
        c.stats.mp = Math.min(c.stats.maxMp, c.stats.mp + 0.2);
        return true;
      }
    }
    return false;
  }

  private weaponRange(c: Character): number {
    switch (c.inventory.weapon) {
      case 'sword':
        return COMBAT.RANGE_SWORD * COMBAT.TILE;
      case 'pole':
        return COMBAT.RANGE_POLE * COMBAT.TILE;
      case 'bow':
        return (COMBAT.RANGE_BOW_MIN + (c.stats.dexterity / 100) * (COMBAT.RANGE_BOW_MAX - COMBAT.RANGE_BOW_MIN)) * COMBAT.TILE;
      case 'magic':
        return (COMBAT.RANGE_MAGIC_MIN + (c.stats.magic / 100) * (COMBAT.RANGE_MAGIC_MAX - COMBAT.RANGE_MAGIC_MIN)) * COMBAT.TILE;
    }
  }

  private perceptionRange(c: Character): number {
    return AI.PERCEPTION_BASE + c.stats.perception * 3;
  }

  private decayNeeds(c: Character, dt: number): void {
    c.needs.hunger += AI.NEED_DECAY * dt;
    c.needs.sleep += AI.NEED_DECAY * 0.5 * dt;
    c.needs.lust += AI.NEED_DECAY * 0.3 * dt;
    if (c.inventory.food <= 0) {
      c.stats.health -= 0.2 * dt;
    }
    if (c.stats.health < STATS.HEALTH_DEBUFF_THRESHOLD) {
      // デバフは攻撃計算側で health 参照
    }
  }

  private updateChar(c: Character, dt: number): void {
    c.animPhase += dt * 6;
    c.attackCooldown = Math.max(0, c.attackCooldown - dt);
    c.replanTimer -= dt;
    this.decayNeeds(c, dt);
    this.healAtRefuge(c);

    const isMonster = c.kind !== 'npc';
    const perception = this.perceptionRange(c);

    // 近傍の敵を探索
    const neighbors = this.grid.queryRadius(c.pos, perception);
    let target: Character | null = null;
    let bestD = Infinity;
    for (const o of neighbors) {
      if (o.id === c.id || !o.alive) continue;
      const hostile = this.isHostile(c, o);
      if (!hostile) continue;
      const d = distSq(c.pos, o.pos);
      if (d < bestD) {
        bestD = d;
        target = o;
      }
    }

    if (target) {
      c.targetId = target.id;
      c.state = 'hunt';
      this.combatStep(c, target, dt);
      return;
    }

    // 交配(NPCのみ・性欲)
    if (!isMonster && c.needs.lust > 8) {
      const mate = this.findMate(c, neighbors);
      if (mate) {
        this.tryMate(c, mate);
        return;
      }
    }

    // 目標地点へ移動・なければ徘徊
    if (c.replanTimer <= 0 || !c.goalPos) {
      this.replan(c);
      c.replanTimer = AI.REPLAN_INTERVAL;
    }
    if (c.goalPos) {
      const speed = (isMonster ? AI.SPEED_MONSTER : AI.SPEED_NPC) * dt;
      const next = moveToward(c.pos, c.goalPos, speed);
      c.vel = { x: next.x - c.pos.x, y: next.y - c.pos.y };
      c.pos = next;
      c.idleTime = 0;
      if (dist(c.pos, c.goalPos) < AI.ARRIVE_DIST) {
        c.goalPos = null;
        // 無行動禁止: 都市到着で挨拶
        if (!isMonster) this.maybeGreet(c, neighbors);
      }
    } else {
      c.idleTime += dt;
      if (c.idleTime > AI.IDLE_LIMIT) {
        this.replan(c);
        c.idleTime = 0;
      }
    }
  }

  private isHostile(c: Character, o: Character): boolean {
    if (c.kind !== 'npc' && o.kind !== 'npc') return false; // モンスター同士は無視
    if (c.kind !== 'npc' && o.kind === 'npc') return true; // モンスター→NPC
    if (c.kind === 'npc' && o.kind !== 'npc') return true; // NPC→モンスター
    // NPC同士: 悪徳が相手を襲う / 憎悪関係
    if (c.evil && !o.evil) return true;
    const rel = c.relations.find((r) => r.targetId === o.id);
    if (rel && rel.type === 'hatred') return true;
    return false;
  }

  private findMate(c: Character, neighbors: readonly Character[]): Character | null {
    for (const o of neighbors) {
      if (o.kind !== 'npc' || !o.alive || o.id === c.id) continue;
      if (o.gender === c.gender) continue;
      if (o.needs.lust > 6) return o;
    }
    return null;
  }

  private tryMate(c: Character, mate: Character): void {
    c.needs.lust = 0;
    mate.needs.lust = 0;
    const changed = adjustRelation(c, mate.id, 20, 'love');
    adjustRelation(mate, c.id, 20, 'love');
    if (c.relations.find((r) => r.targetId === mate.id && r.value > EMOTION.LOVE_THRESHOLD)) {
      this.addHistory(c, `${this.name(mate)}と深い絆で結ばれた`);
    }
    const city = this.nearestCity(c.pos);
    city.storedChildren.push({ bornAt: this.clock.minutes, gender: this.rng.chance(0.5) ? 'male' : 'female' });
    this.addHistory(c, `${mate.surname}・${mate.givenName}と交配した`);
    this.addHistory(mate, `${c.surname}・${c.givenName}と交配した`);
    this.log.push(`${this.name(c)}と${this.name(mate)}が結ばれた`, 'green', [c.id, mate.id]);
    if (changed) {
      this.log.push(`${this.name(c)}と${this.name(mate)}は恋仲になった`, 'green', [c.id, mate.id]);
    }
    this.log.chat(c.id, mate.id, this.name(c), this.name(mate), '共に生きよう');
  }

  private maybeGreet(c: Character, neighbors: readonly Character[]): void {
    if (!this.rng.chance(0.1)) return;
    for (const o of neighbors) {
      if (o.kind === 'npc' && o.alive && o.id !== c.id) {
        this.log.chat(c.id, o.id, this.name(c), this.name(o), greetPhrase(this.rng));
        const changed = adjustRelation(c, o.id, 3, 'friend');
        adjustRelation(o, c.id, 3, 'friend');
        if (changed) this.log.push(`${this.name(c)}と${this.name(o)}が親しくなった`, 'green', [c.id, o.id]);
        return;
      }
    }
  }

  private replan(c: Character): void {
    if (c.kind !== 'npc') {
      this.replanMonster(c);
      return;
    }
    this.maybeTurnBandit(c);
    const result = plan(c);
    c.state = this.goalToState(result.goal);
    const action = result.actions[0];
    this.applyAction(c, action);
  }

  private goalToState(goal: string): Character['state'] {
    switch (goal) {
      case 'survive':
      case 'eat':
      case 'sleep':
        return 'seekCity';
      case 'mate':
        return 'mate';
      case 'hunt':
      case 'gainFame':
      case 'earnMoney':
        return 'hunt';
      case 'banditRaid':
        return 'banditRaid';
      default:
        return 'wander';
    }
  }

  private applyAction(c: Character, action: GoapAction): void {
    switch (action) {
      case 'gotoCity':
      case 'buyFood':
      case 'sellTreasure':
      case 'seekMate':
      case 'restAtRefuge': {
        const home = this.world.cities[c.homeCityId] ?? this.nearestCity(c.pos);
        const dst = c.cityAttachment > 0.5 ? home : this.nearestCity(c.pos);
        c.goalPos = { x: dst.pos.x + this.rng.range(-150, 150), y: dst.pos.y + this.rng.range(-150, 150) };
        if (action === 'buyFood' && c.inventory.gold >= 10) {
          c.inventory.gold -= 10;
          c.inventory.food += 5;
          c.needs.hunger = 0;
        }
        if (action === 'sellTreasure' && c.inventory.treasures > 0) {
          c.inventory.gold += c.inventory.treasures * 50;
          this.log.push(`${this.name(c)}が財宝を${c.inventory.treasures * 50}金で換金した`, 'yellow', [c.id]);
          c.inventory.treasures = 0;
        }
        break;
      }
      case 'gotoVillage': {
        const v = this.rng.pick(this.world.villages);
        c.goalPos = { x: v.pos.x, y: v.pos.y };
        break;
      }
      case 'gotoFort': {
        const f = this.forts.nearestFort(c.pos);
        c.goalPos = f ? { x: f.pos.x, y: f.pos.y } : this.wanderGoal(c);
        break;
      }
      case 'seekPrey':
      case 'seekVictim': {
        if (this.world.roads.length > 0) {
          const road = this.rng.pick(this.world.roads);
          const t = this.rng.next();
          c.goalPos = { x: road.a.x + (road.b.x - road.a.x) * t, y: road.a.y + (road.b.y - road.a.y) * t };
        } else {
          c.goalPos = this.wanderGoal(c);
        }
        break;
      }
      case 'roam':
      default:
        c.goalPos = this.wanderGoal(c);
        break;
    }
  }

  private wanderGoal(c: Character): Vec2 {
    const target = this.rng.chance(0.5)
      ? this.rng.pick(this.world.cities).pos
      : this.rng.pick(this.world.villages).pos;
    return { x: target.x + this.rng.range(-150, 150), y: target.y + this.rng.range(-150, 150) };
  }

  private replanMonster(c: Character): void {
    if (c.monsterDarkness > 0.6 && this.world.roads.length > 0) {
      const road = this.rng.pick(this.world.roads);
      const t = this.rng.next();
      c.goalPos = { x: road.a.x + (road.b.x - road.a.x) * t, y: road.a.y + (road.b.y - road.a.y) * t };
    } else {
      const r = AI.WANDER_RADIUS * (0.4 + c.monsterDarkness);
      c.goalPos = this.clampWorld({ x: c.pos.x + this.rng.range(-r, r), y: c.pos.y + this.rng.range(-r, r) });
    }
    if (this.rng.chance(0.05)) this.log.chat(c.id, -1, this.name(c), '', monsterCry(this.rng));
  }

  private clampWorld(p: Vec2): Vec2 {
    return {
      x: Math.max(WORLD.EDGE_MARGIN, Math.min(WORLD.WIDTH - WORLD.EDGE_MARGIN, p.x)),
      y: Math.max(WORLD.EDGE_MARGIN, Math.min(WORLD.HEIGHT - WORLD.EDGE_MARGIN, p.y))
    };
  }

  private combatStep(c: Character, target: Character, dt: number): void {
    const range = this.weaponRange(c);
    const d = dist(c.pos, target.pos);
    if (d > range) {
      const speed = (c.kind === 'npc' ? AI.SPEED_NPC : AI.SPEED_MONSTER) * dt;
      const next = moveToward(c.pos, target.pos, speed);
      c.vel = { x: next.x - c.pos.x, y: next.y - c.pos.y };
      c.pos = next;
      return;
    }
    c.vel = { x: 0, y: 0 };
    if (c.attackCooldown > 0) return;
    c.attackCooldown = COMBAT.ATTACK_COOLDOWN;
    this.attack(c, target);
  }

  private effectiveStat(c: Character, base: number): number {
    if (c.stats.health < STATS.HEALTH_DEBUFF_THRESHOLD) {
      const penalty = (STATS.HEALTH_DEBUFF_THRESHOLD - c.stats.health) / STATS.HEALTH_DEBUFF_THRESHOLD;
      return base * (1 - penalty * 0.5);
    }
    return base;
  }

  private attack(c: Character, target: Character): void {
    const useMagic = c.inventory.weapon === 'magic' && c.stats.mp > 10;
    let dmg: number;
    if (useMagic) {
      c.stats.mp -= 10;
      dmg = this.effectiveStat(c, c.stats.magic) * (0.8 + this.rng.next() * 0.5);
      if (c.kind === 'npc') this.log.chat(c.id, target.id, this.name(c), this.name(target), magicPhrase(this.rng));
    } else {
      dmg = this.effectiveStat(c, c.stats.power) * (0.6 + this.rng.next() * 0.6);
      if (c.kind === 'npc' && c.skills.special > 70 && this.rng.chance(0.15)) {
        dmg *= 2;
        this.log.chat(c.id, target.id, this.name(c), this.name(target), specialPhrase(this.rng));
      } else if (c.kind === 'npc' && this.rng.chance(0.08)) {
        this.log.chat(c.id, target.id, this.name(c), this.name(target), huntPhrase(this.rng));
      } else if (c.kind !== 'npc' && this.rng.chance(0.1)) {
        this.log.chat(c.id, -1, this.name(c), '', monsterCry(this.rng));
      }
    }
    // 回避判定
    if (this.rng.next() * 100 < target.stats.reflex * 0.3) {
      this.addEffect(target.pos, 'buff');
      return;
    }
    const finalDmg = Math.max(1, Math.floor(dmg - target.stats.reflex * 0.1));
    target.stats.hp -= finalDmg;
    this.addEffect(target.pos, 'damage');
    if (target.stats.hp <= 0) {
      this.onDeath(c, target);
    } else {
      // 被攻撃で憎悪
      if (target.kind === 'npc' && c.kind === 'npc') {
        const changed = adjustRelation(target, c.id, -15, 'hatred');
        if (changed) this.log.push(`${this.name(target)}は${this.name(c)}を憎むようになった`, 'green', [target.id, c.id]);
      }
    }
    // 成長
    c.needs.growth += 0.5;
    if (c.needs.growth > 20) {
      c.needs.growth = 0;
      c.stats.power += 1;
      this.addHistory(c, `力が1上がった`);
    }
  }

  private onDeath(killer: Character, victim: Character): void {
    victim.alive = false;
    victim.deadSince = this.clock.minutes;
    victim.stats.hp = 0;
    if (victim.kind === 'npc') {
      this.log.chat(victim.id, killer.id, this.name(victim), this.name(killer), deathPhrase(this.rng, victim));
    } else {
      this.log.chat(victim.id, -1, this.name(victim), '', deathPhrase(this.rng, victim));
    }
    // 生殺与奪: 強奪・捕食
    killer.inventory.gold += victim.inventory.gold;
    killer.inventory.treasures += victim.inventory.treasures;
    if (killer.kind !== 'npc' || killer.evil) {
      killer.inventory.food += 2; // 捕食
      this.addHistory(killer, `${this.name(victim)}を捕食した`);
      this.log.push(`${this.name(killer)}が${this.name(victim)}を捕食した`, 'red', [killer.id, victim.id]);
    } else {
      this.addHistory(killer, `${this.name(victim)}を討伐した`);
      this.log.push(`${this.name(killer)}が${this.name(victim)}を討伐した`, 'red', [killer.id, victim.id]);
    }
    if (victim.inventory.treasures > 0) {
      this.log.push(`${this.name(killer)}が財宝を奪った`, 'gold', [killer.id]);
    }
    if (victim.inventory.gold > 0) {
      this.log.push(`${this.name(killer)}が${victim.inventory.gold}金を強奪した`, 'yellow', [killer.id]);
    }
    killer.stats.honor += 2;
    // 死亡時、近傍の友好NPCに憎悪を伝播(アクシデント反応)
    const witnesses = this.grid.queryRadius(victim.pos, AI.PERCEPTION_BASE);
    for (const w of witnesses) {
      if (w.kind !== 'npc' || !w.alive || w.id === killer.id) continue;
      const rel = w.relations.find((r) => r.targetId === victim.id);
      if (rel && (rel.type === 'friend' || rel.type === 'love')) {
        const changed = adjustRelation(w, killer.id, EMOTION.ACCIDENT_PENALTY, 'hatred');
        if (changed) this.log.push(`${this.name(w)}は${this.name(killer)}に復讐を誓った`, 'green', [w.id, killer.id]);
      }
    }
    killer.title = computeTitle(killer);
  }

  name(c: Character): string {
    return `${c.title}${c.surname}・${c.givenName}`;
  }

  revive(id: number): void {
    const c = this.chars.get(id);
    if (!c) return;
    c.alive = true;
    c.deadSince = -1;
    c.stats.hp = c.stats.maxHp;
    c.stats.mp = c.stats.maxMp;
    c.stats.health = STATS.BASE_HEALTH;
    this.addHistory(c, `蘇生した`);
    this.log.push(`${this.name(c)}が蘇った`, 'green', [c.id]);
  }

  fullHeal(id: number): void {
    const c = this.chars.get(id);
    if (!c || !c.alive) return;
    c.stats.hp = c.stats.maxHp;
    c.stats.mp = c.stats.maxMp;
    c.stats.health = STATS.BASE_HEALTH;
    this.addEffect(c.pos, 'heal');
  }

  cityStayCount(cityId: number): number {
    const city = this.world.cities[cityId];
    let n = 0;
    for (const c of this.chars.values()) {
      if (c.alive && c.kind === 'npc' && dist(c.pos, city.pos) < RENDER.CITY_RADIUS + 60) n++;
    }
    return n;
  }

  private maintainForts(): void {
    const result = this.forts.refresh((id) => {
      const c = this.chars.get(id);
      return !!c && c.alive && c.evil;
    });
    for (const f of result.decayed) {
      this.log.push(`砦#${f.id}が朽ちて消滅した`, 'white', []);
      const idx = this.world.forts.findIndex((wf) => wf.id === f.id);
      if (idx >= 0) {
        const layerForts = this.world.forts[idx];
        layerForts.alive = false;
      }
    }
  }

  private maybeTurnBandit(c: Character): void {
    if (c.kind !== 'npc' || c.evil) return;
    const broke = c.inventory.gold <= FORT.BANDIT_CONVERT_GOLD;
    const wicked = c.stats.moral <= FORT.EVIL_MORAL_THRESHOLD;
    if ((broke && this.rng.chance(0.02)) || (wicked && this.rng.chance(0.01))) {
      c.evil = true;
      c.stats.moral = Math.min(c.stats.moral, -6);
      const near = this.forts.nearestFort(c.pos);
      if (near && dist(near.pos, c.pos) < FORT.RECRUIT_RANGE) {
        this.forts.recruit(near, c);
      } else {
        const fort = this.forts.createFort(this.clampWorld(c.pos), c);
        this.world.forts.push(fort);
      }
      c.title = computeTitle(c);
      this.addHistory(c, `夜盗に身を落とした`);
      this.log.push(`${this.name(c)}が夜盗化した`, 'red', [c.id]);
    }
  }
}