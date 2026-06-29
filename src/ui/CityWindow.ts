// 責務: 都市詳細(都市名/人口/滞在NPC一覧/クエスト一覧/出来事一覧)の表示。

import { City } from '../domain/City';
import { World } from '../world/World';
import { DraggableWindow } from './DraggableWindow';

export class CityWindow extends DraggableWindow {
  constructor(city: City, world: World) {
    super(`都市: ${city.name}`, 320, 380);
    this.render(city, world);
  }

  private render(city: City, world: World): void {
    const rows: string[] = [];
    rows.push(this.section('概要'));
    rows.push(this.kv('都市名', city.name));
    rows.push(this.kv('人口', `${city.population}`));
    rows.push(this.kv('滞在NPC数', `${city.residents.size}`));

    rows.push(this.section('滞在NPC一覧'));
    if (city.residents.size === 0) {
      rows.push('<div style="opacity:0.6">滞在NPCなし</div>');
    } else {
      for (const id of city.residents) {
        const c = world.findCharacter(id);
        if (c) {
          rows.push(`<div>・${c.displayName}</div>`);
        }
      }
    }

    rows.push(this.section('発注クエスト一覧'));
    rows.push('<div style="opacity:0.6">(第2便で実装)</div>');

    rows.push(this.section('都市内出来事一覧'));
    if (city.events.length === 0) {
      rows.push('<div style="opacity:0.6">出来事なし</div>');
    } else {
      for (const e of city.events) {
        rows.push(`<div style="margin:2px 0">・${e.text}</div>`);
      }
    }

    this.body.innerHTML = rows.join('');
  }

  private section(title: string): string {
    return `<div style="margin:8px 0 4px;font-weight:bold;color:#ffd97a;border-bottom:1px solid #444">${title}</div>`;
  }

  private kv(k: string, v: string): string {
    return `<div style="display:flex;justify-content:space-between;margin:1px 0"><span style="opacity:0.8">${k}</span><span>${v}</span></div>`;
  }
}