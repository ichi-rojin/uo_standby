// 責務: キャラクター(NPC/モンスター/ボス)のデータモデル
import type {
  Abilities,
  Skills,
  Needs,
  Inventory,
  Vec2,
  CharacterKind,
  Gender,
  GoalType,
  HistoryEntry,
  RelationMap
} from '../domain/types';

export class Character {
  id: number;
  kind: CharacterKind;
  gender: Gender;
  surname: string;
  givenName: string;
  title: string;
  pos: Vec2;
  vel: Vec2;
  ab: Abilities;
  skills: Skills;
  needs: Needs;
  inv: Inventory;
  isBandit: boolean;
  cityAttachment: number;
  homeCityId: number;
  goal: GoalType;
  targetId: number;
  targetPos: Vec2 | null;
  alive: boolean;
  deathTick: number;
  attackCooldown: number;
  animPhase: number;
  history: HistoryEntry[];
  relations: RelationMap;
  buffTicks: number;
  debuffTicks: number;
  hueSeed: number;

  constructor(id: number, kind: CharacterKind, gender: Gender) {
    this.id = id;
    this.kind = kind;
    this.gender = gender;
    this.surname = '';
    this.givenName = '';
    this.title = '';
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.ab = {
      hp: 100, maxHp: 100, mp: 50, maxMp: 50, health: 100,
      power: 10, agility: 10, reaction: 10, perception: 10,
      dexterity: 10, magic: 10, honor: 0, moral: 0
    };
    this.skills = {
      swordSkill: 0, poleSkill: 0, bowSkill: 0,
      magicAttack: 0, magicHeal: 0, magicBuff: 0, magicDebuff: 0,
      mapKnowledge: 0, special: 0
    };
    this.needs = {
      hunger: 50, sleep: 50, lust: 50, greed: 50,
      honorWant: 50, growth: 50, skillWant: 50
    };
    this.inv = { weapon: 'sword', food: 10, valuables: 0, money: 50 };
    this.isBandit = false;
    this.cityAttachment = 0.5;
    this.homeCityId = -1;
    this.goal = 'idle';
    this.targetId = -1;
    this.targetPos = null;
    this.alive = true;
    this.deathTick = -1;
    this.attackCooldown = 0;
    this.animPhase = 0;
    this.history = [];
    this.relations = {};
    this.buffTicks = 0;
    this.debuffTicks = 0;
    this.hueSeed = 0;
  }

  fullName(): string {
    return `(${this.title})${this.surname}・${this.givenName}`;
  }

  addHistory(tick: number, text: string): void {
    this.history.push({ tick, text });
    if (this.history.length > 200) this.history.shift();
  }
}