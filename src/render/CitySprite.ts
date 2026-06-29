// 責務: 都市アイコン+ラベル(都市名+滞在NPC数+人口)の表示。

import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { COLORS, WORLD } from '../config/GameConfig';
import { City } from '../domain/City';
import { drawCityIcon } from './ProceduralTextures';

const ICON_SIZE = WORLD.TILE_SIZE * 2.0;

export class CitySprite {
  readonly container: Container = new Container();
  readonly city: City;
  private readonly label: Text;

  constructor(city: City, externalTexture: Texture | null) {
    this.city = city;
    if (externalTexture) {
      const sp = new Sprite(externalTexture);
      sp.anchor.set(0.5);
      sp.width = ICON_SIZE;
      sp.height = ICON_SIZE;
      this.container.addChild(sp);
    } else {
      const g = new Graphics();
      drawCityIcon(g, COLORS.CITY, ICON_SIZE);
      this.container.addChild(g);
    }

    const style = new TextStyle({
      fontSize: 11,
      fill: COLORS.CITY,
      align: 'center',
    });
    this.label = new Text({ text: '', style });
    this.label.anchor.set(0.5, 0);
    this.label.position.set(0, ICON_SIZE * 0.55);
    this.container.addChild(this.label);

    this.container.position.set(city.x, city.y);
    this.refresh();
  }

  refresh(): void {
    this.label.text = `${this.city.name}\n滞在${this.city.residents.size} 人口${this.city.population}`;
  }
}