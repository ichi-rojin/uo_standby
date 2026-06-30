// File: src/entities/Character.ts
// 責務: NPC・モンスター・ボスを表すキャラクターのデータと状態保持。

import { Entity } from './Entity';
import {
  Attributes,
  Skills,
  Inventory,
  Desires,
  Gender,
  EntityKind,
  CharacterState,
  HistoryEntry,
} from '../domain/types';
import { StatsConfig } from '../config/GameConfig';

export interface CharacterInit {
  kind: EntityKind;
  gender: Gender;
  family: string;
  given: string;
  title: string;
  hpMax: number;
  mpMax: number;
  attributes: Attributes;
  skills: Skills;
  inventory: Inventory;
  desires: Desires;
  isEvil: boolean;
  belonging: number;
  monsterTint: number;
  x: number;
  y: number;
}

export class Character extends Entity {
  public readonly kind: EntityKind;
  public readonly gender: Gender;
  public family: string;
  public given: string;
  public title: string;
  public hp: number;
  public hpMax: number;
  public mp: number;
  public mpMax: number;
  public health: number;
  public readonly attributes: Attributes;
  public readonly skills: Skills;
  public readonly inventory: Inventory;
  public readonly desires: Desires;
  public isEvil: boolean;
  public belonging: number;
  public state: CharacterState;
  public targetX: number;
  public targetY: number;
  public deathTimer: number;
  public readonly history: HistoryEntry[];
  public readonly monsterTint: number;
  public animPhase: number;

  constructor(init: CharacterInit) {
    super(init.x, init.y);
    this.kind = init.kind;
    this.gender = init.gender;
    this.family = init.family;
    this.given = init.given;
    this.title = init.title;
    this.hpMax = init.hpMax;
    this.hp = init.hpMax;
    this.mpMax = init.mpMax;
    this.mp = init.mpMax;
    this.health = StatsConfig.HEALTH_MAX;
    this.attributes = init.attributes;
    this.skills = init.skills;
    this.inventory = init.inventory;
    this.desires = init.desires;
    this.isEvil = init.isEvil;
    this.belonging = init.belonging;
    this.state = CharacterState.Idle;
    this.targetX = init.x;
    this.targetY = init.y;
    this.deathTimer = 0;
    this.history = [];
    this.monsterTint = init.monsterTint;
    this.animPhase = Math.random() * Math.PI * 2;
  }

  public get fullName(): string {
    return `${this.family}・${this.given}`;
  }

  public get displayName(): string {
    return `(${this.title})${this.family}・${this.given}`;
  }

  public isDead(): boolean {
    return this.state === CharacterState.Dead;
  }

  public addHistory(stamp: string, text: string): void {
    this.history.push({ stamp, text });
  }
}