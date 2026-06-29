// src/render/CityRenderer.ts
// 責務: 都市・補給拠点のビジュアルとラベル（都市名+滞在数+人口）を描画・更新する。

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { WorldState } from '../world/WorldState';
import type { SpriteFactory } from './ProceduralTextures';
import type { CityData, SupplyPostData } from '../domain/types';
import type { EntityId } from '../domain/ids';
import { ENTITY_SIZE } from '../config/constants';

const CITY_LABEL_STYLE = new TextStyle({
  fill: 0xffffff,
  fontSize: 26,
  fontFamily: 'sans-serif',
  align: 'center',
  stroke: { color: 0x000000, width: 4 },
});

const POST_LABEL_STYLE = new TextStyle({
  fill: 0xcccccc,
  fontSize: 18,
  fontFamily: 'sans-serif',
  stroke: { color: 0x000000, width: 3 },
});

interface CityVisual {
  container: Container;
  label: Text;
  data: CityData;
}

export type CityClickHandler = (cityId: EntityId) => void;

export class CityRenderer {
  readonly container: Container;
  private readonly cityVisuals: CityVisual[] = [];

  constructor(world: WorldState, factory: SpriteFactory, onCityClick: CityClickHandler) {
    this.container = new Container();
    this.buildCities(world, factory, onCityClick);
    this.buildPosts(world, factory);
  }

  private buildCities(world: WorldState, factory: SpriteFactory, onCityClick: CityClickHandler): void {
    for (const city of world.cities) {
      const wrap = new Container();
      wrap.x = city.position.x;
      wrap.y = city.position.y;
      const visual = factory.createCityVisual();
      visual.eventMode = 'static';
      visual.cursor = 'pointer';
      const cityId = city.id;
      visual.on('pointertap', () => onCityClick(cityId));
      wrap.addChild(visual);

      const label = new Text({ text: '', style: CITY_LABEL_STYLE });
      label.anchor.set(0.5, 0);
      label.y = ENTITY_SIZE.CITY_RADIUS + 6;
      wrap.addChild(label);

      this.container.addChild(wrap);
      this.cityVisuals.push({ container: wrap, label, data: city });
    }
  }

  private buildPosts(world: WorldState, factory: SpriteFactory): void {
    for (const post of world.supplyPosts) {
      this.buildPost(post, factory);
    }
  }

  private buildPost(post: SupplyPostData, factory: SpriteFactory): void {
    const wrap = new Container();
    wrap.x = post.position.x;
    wrap.y = post.position.y;
    const visual = factory.createSupplyVisual();
    wrap.addChild(visual);
    const label = new Text({ text: post.name, style: POST_LABEL_STYLE });
    label.anchor.set(0.5, 0);
    label.y = ENTITY_SIZE.SUPPLY_RADIUS + 4;
    wrap.addChild(label);
    this.container.addChild(wrap);
  }

  update(world: WorldState): void {
    for (const cv of this.cityVisuals) {
      const staying = countStaying(world, cv.data);
      cv.label.text = `${cv.data.name}\n滞在${staying} 人口${cv.data.population}`;
    }
  }

  // 拠点アイコンの背景補助（未使用化を避けるためにグリッド点を描く）
  static buildBackdrop(): Graphics {
    return new Graphics();
  }
}

function countStaying(world: WorldState, city: CityData): number {
  let count = 0;
  for (const id of city.residentIds) {
    const c = world.characters.get(id);
    if (c && c.state === 'ALIVE') count += 1;
  }
  return count;
}