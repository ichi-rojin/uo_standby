// 責務: キャラクター詳細(全能力値・性別・所持品・履歴)の表示ウインドウ。

import { STATS_RANGE } from '../config/GameConfig';
import { Character } from '../domain/Character';
import { DraggableWindow } from './DraggableWindow';

const GENDER_LABEL: Record<Character['gender'], string> = {
  male: '男性',
  female: '女性',
};

export class CharacterWindow extends DraggableWindow {
  constructor(character: Character) {
    super(`キャラクター: ${character.displayName}`, 340, 420);
    this.render(character);
  }

  private render(c: Character): void {
    const rows: string[] = [];
    rows.push(this.section('基本'));
    rows.push(this.kv('姓・名', `${c.family}・${c.given}`));
    rows.push(this.kv('通り名', c.title));
    rows.push(this.kv('性別', GENDER_LABEL[c.gender]));
    rows.push(this.kv('種別', this.kindLabel(c)));
    rows.push(this.kv('陣営', c.faction));
    rows.push(this.kv('状態', c.alive ? '生存' : '死亡'));

    rows.push(this.section('能力値'));
    rows.push(this.kv('HP', `${Math.round(c.hp)} / ${c.maxHp}`));
    rows.push(this.kv('MP', `${Math.round(c.mp)} / ${c.maxMp}`));
    rows.push(
      this.kv(
        '健康度',
        `${Math.round((c.health / STATS_RANGE.HEALTH_MAX) * 100)}%`
      )
    );
    rows.push(this.kv('体格', `${c.attributes.build}`));
    rows.push(this.kv('瞬発力', `${c.attributes.agility}`));
    rows.push(this.kv('反応', `${c.attributes.reaction}`));
    rows.push(this.kv('知覚', `${c.attributes.perception}`));
    rows.push(this.kv('巧緻性', `${c.attributes.dexterity}`));
    rows.push(this.kv('魔法力', `${c.attributes.magicPower}`));

    rows.push(this.section('スキル'));
    rows.push(this.kv('剣', `${c.skills.sword}`));
    rows.push(this.kv('長柄', `${c.skills.polearm}`));
    rows.push(this.kv('弓', `${c.skills.bow}`));
    rows.push(this.kv('魔法(攻)', `${c.skills.magicAttack}`));
    rows.push(this.kv('魔法(バフ)', `${c.skills.magicBuff}`));
    rows.push(this.kv('魔法(デバフ)', `${c.skills.magicDebuff}`));
    rows.push(this.kv('地図把握度', `${c.skills.cartography}`));

    rows.push(this.section('所持品'));
    rows.push(this.kv('武器', c.inventory.weapon));
    rows.push(this.kv('食料', `${Math.round(c.inventory.food)}`));
    rows.push(this.kv('値打ちもの', `${c.inventory.treasures}`));
    rows.push(this.kv('金銭', `${c.inventory.gold}`));

    rows.push(this.section('履歴'));
    const history = c.getHistory();
    if (history.length === 0) {
      rows.push('<div style="opacity:0.6">履歴なし</div>');
    } else {
      for (const h of history) {
        rows.push(`<div style="margin:2px 0">・${h.text}</div>`);
      }
    }

    this.body.innerHTML = rows.join('');
  }

  private kindLabel(c: Character): string {
    if (c.kind === 'npc') {
      return 'NPC';
    }
    if (c.kind === 'boss') {
      return 'ボス';
    }
    return 'モンスター';
  }

  private section(title: string): string {
    return `<div style="margin:8px 0 4px;font-weight:bold;color:#ffd97a;border-bottom:1px solid #444">${title}</div>`;
  }

  private kv(k: string, v: string): string {
    return `<div style="display:flex;justify-content:space-between;margin:1px 0"><span style="opacity:0.8">${k}</span><span>${v}</span></div>`;
  }
}