// 責務: キャラクター(NPC/モンスター/ボス)のデータモデルと派生計算・履歴管理。

import { STATS_RANGE, MOVEMENT } from '../config/GameConfig';
import { Rng } from '../core/Rng';
import {
  generateMonsterName,
  generateNpcName,
  generateTitle,
} from './NameGenerator';
import { rollAttributes, rollSkills } from './Stats';
import {
  Attributes,
  CharacterKind,
  Desires,
  Faction,
  Gender,
  HistoryEntry,
  Inventory,
  Skills,
  Vector2,
  WeaponType,
} from './types';

const WEAPONS: readonly WeaponType[] = ['sword', 'polearm', 'bow'];

export interface CharacterInit {
  id: number;
  kind: CharacterKind;
  position: Vector2;
  rng: Rng;
}

export class Character {
  readonly id: number;
  readonly kind: CharacterKind;
  readonly gender: Gender;
  readonly family: string;
  readonly given: string;
  title: string;

  faction: Faction;

  attributes: Attributes;
  skills: Skills;
  inventory: Inventory;
  desires: Desires;

  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  health: number;

  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;

  /** 都市帰属度 0(放浪)〜1(完全帰属) */
  cityAttachment: number;
  /** 現在滞在中の都市ID(なければnull) */
  currentCityId: number | null;

  alive = true;
  /** 死亡したゲーム内分(grayscale判定用) */
  deathMinute = 0;

  attackCooldown = 0;
  idleMinutes = 0;
  wanderTimer = 0;

  /** アニメーション位相 */
  animPhase: number;

  private readonly history: HistoryEntry[] = [];

  constructor(init: CharacterInit) {
    const { rng } = init;
    this.id = init.id;
    this.kind = init.kind;
    this.gender = rng.chance(0.5) ? 'male' : 'female';

    if (init.kind === 'npc') {
      const n = generateNpcName(rng, this.gender);
      this.family = n.family;
      this.given = n.given;
      this.faction = rng.chance(0.12) ? 'bandit' : 'civil';
    } else {
      const n = generateMonsterName(rng);
      this.family = n.family;
      this.given = n.given;
      this.faction = 'wild';
    }

    this.attributes = rollAttributes(rng);
    this.skills = rollSkills(rng);

    const weapon: WeaponType =
      init.kind === 'npc' ? rng.pick(WEAPONS) : 'none';
    this.inventory = {
      weapon,
      food: rng.intRange(5, 30),
      treasures: 0,
      gold: rng.intRange(0, 100),
    };

    this.desires = {
      basic: rng.next(),
      money: rng.next(),
      honor: rng.next(),
      growth: rng.next(),
      skill: rng.next(),
    };

    this.maxHp = rng.intRange(STATS_RANGE.HP_MIN, STATS_RANGE.HP_MAX);
    this.hp = this.maxHp;
    this.maxMp = rng.intRange(STATS_RANGE.MP_MIN, STATS_RANGE.MP_MAX);
    this.mp = this.maxMp;
    this.health = STATS_RANGE.HEALTH_MAX;

    this.x = init.position.x;
    this.y = init.position.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed =
      init.kind === 'npc'
        ? MOVEMENT.NPC_BASE_SPEED
        : MOVEMENT.MONSTER_BASE_SPEED;

    this.cityAttachment = init.kind === 'npc' ? rng.next() : 0;
    this.currentCityId = null;

    this.title =
      init.kind === 'npc'
        ? generateTitle(rng, weapon)
        : '魔物';

    this.animPhase = rng.range(0, Math.PI * 2);
  }

  get displayName(): string {
    return `(${this.title})${this.family}・${this.given}`;
  }

  addHistory(entry: HistoryEntry): void {
    this.history.push(entry);
  }

  getHistory(): readonly HistoryEntry[] {
    return this.history;
  }

  /** モンスターの強さ(0..1)。色生成に使用 */
  monsterStrengthRatio(): number {
    const a = this.attributes;
    const sum =
      a.build + a.agility + a.reaction + a.perception + a.dexterity + a.magicPower;
    const max = STATS_RANGE.ATTR_MAX * 6;
    const min = STATS_RANGE.ATTR_MIN * 6;
    return (sum - min) / (max - min);
  }
}