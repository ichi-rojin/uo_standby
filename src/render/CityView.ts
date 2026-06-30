// File: src/render/CityView.ts
// 責務: 都市または補給拠点1件の描画。本体・名称・滞在数・人口ラベル。

import { Container, Graphics, Text, TextStyle, Sprite, Assets as PixiAssets } from 'pixi.js';
import { City } from '../entities/City';
import { Supply } from '../entities/Supply';
import { RenderConfig, ColorConfig } from '../config/GameConfig';
import { drawCityBody, drawSupplyBody } from './ProceduralDraw';
import { Assets } from './AssetConfig';

export class CityView {
  public readonly container: Container;
  private readonly body: Graphics;
  private readonly label: Text;

  constructor(private readonly city: City) {
    this.container = new Container();
    this.body = new Graphics();
    drawCityBody(this.body);
    const style = new TextStyle({
      fontSize: 11,
      fill: ColorConfig.TEXT,
      stroke: { color: 0x000000, width: 2 },
    });
    this.label = new Text({ text: '', style });
    this.label.anchor.set(0.5, 0);
    this.label.y = RenderConfig.CITY_RADIUS + 4;
    this.container.addChild(this.body);
    this.container.addChild(this.label);
    this.container.x = city.x;
    this.container.y = city.y;
    this.refresh();
    this.tryLoadExternal();
  }

  private tryLoadExternal(): void {
    const entry = Assets.city;
    if (!entry.enabled || entry.url === '') {
      return;
    }
    const url = entry.url;
    void PixiAssets.load(url).then((texture) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.width = RenderConfig.CITY_RADIUS * 2;
      sprite.height = RenderConfig.CITY_RADIUS * 2;
      this.body.visible = false;
      this.container.addChildAt(sprite, 0);
    });
  }

  public refresh(): void {
    this.label.text = `${this.city.name}\n滞在${this.city.stayingNpcIds.size} 人口${this.city.population}`;
  }
}

export class SupplyView {
  public readonly container: Container;
  private readonly body: Graphics;
  private readonly label: Text;

  constructor(private readonly supply: Supply) {
    this.container = new Container();
    this.body = new Graphics();
    drawSupplyBody(this.body);
    const style = new TextStyle({
      fontSize: 9,
      fill: ColorConfig.TEXT,
      stroke: { color: 0x000000, width: 2 },
    });
    this.label = new Text({ text: supply.name, style });
    this.label.anchor.set(0.5, 0);
    this.label.y = RenderConfig.SUPPLY_RADIUS + 2;
    this.container.addChild(this.body);
    this.container.addChild(this.label);
    this.container.x = supply.x;
    this.container.y = supply.y;
    this.tryLoadExternal();
  }

  private tryLoadExternal(): void {
    const entry = Assets.supply;
    if (!entry.enabled || entry.url === '') {
      return;
    }
    const url = entry.url;
    void PixiAssets.load(url).then((texture) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.width = RenderConfig.SUPPLY_RADIUS * 2;
      sprite.height = RenderConfig.SUPPLY_RADIUS * 2;
      this.body.visible = false;
      this.container.addChildAt(sprite, 0);
    });
  }
}