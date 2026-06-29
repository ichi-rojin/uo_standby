// src/render/ProceduralTextures.ts
// 責務: PixiJS Graphics でプロシージャルにマップチップ・キャラ・敵・拠点の基本形状を生成し、
//       設定により外部画像（Texture）へ差し替えられるようにする。

import { Graphics, Texture, Sprite, Assets, Container } from 'pixi.js';
import { RENDER_CONFIG } from '../config/renderConfig';
import { ENTITY_SIZE } from '../config/constants';

export interface SpriteFactory {
  createCityVisual(): Container;
  createSupplyVisual(): Container;
}

class ProceduralFactory implements SpriteFactory {
  createCityVisual(): Container {
    const g = new Graphics();
    const r = ENTITY_SIZE.CITY_RADIUS;
    g.circle(0, 0, r).fill({ color: 0x3a4a6a });
    g.circle(0, 0, r * 0.7).fill({ color: 0x5a6f9a });
    g.rect(-r * 0.35, -r * 0.55, r * 0.7, r * 0.5).fill({ color: 0x8a6a3a });
    g.moveTo(-r * 0.4, -r * 0.55)
      .lineTo(0, -r * 0.85)
      .lineTo(r * 0.4, -r * 0.55)
      .fill({ color: 0xb04030 });
    return g;
  }

  createSupplyVisual(): Container {
    const g = new Graphics();
    const r = ENTITY_SIZE.SUPPLY_RADIUS;
    g.circle(0, 0, r).fill({ color: 0x4a5a3a });
    g.rect(-r * 0.5, -r * 0.3, r, r * 0.6).fill({ color: 0x8a7a4a });
    g.moveTo(-r * 0.55, -r * 0.3)
      .lineTo(0, -r * 0.6)
      .lineTo(r * 0.55, -r * 0.3)
      .fill({ color: 0x7a4a30 });
    return g;
  }
}

class TextureFactory implements SpriteFactory {
  private readonly cityTex: Texture;
  private readonly supplyTex: Texture;

  constructor(cityTex: Texture, supplyTex: Texture) {
    this.cityTex = cityTex;
    this.supplyTex = supplyTex;
  }

  createCityVisual(): Container {
    const s = new Sprite(this.cityTex);
    s.anchor.set(0.5);
    s.width = ENTITY_SIZE.CITY_RADIUS * 2;
    s.height = ENTITY_SIZE.CITY_RADIUS * 2;
    return s;
  }

  createSupplyVisual(): Container {
    const s = new Sprite(this.supplyTex);
    s.anchor.set(0.5);
    s.width = ENTITY_SIZE.SUPPLY_RADIUS * 2;
    s.height = ENTITY_SIZE.SUPPLY_RADIUS * 2;
    return s;
  }
}

export async function createSpriteFactory(): Promise<SpriteFactory> {
  if (!RENDER_CONFIG.useExternalSprites) {
    return new ProceduralFactory();
  }
  const cityTex = await Assets.load<Texture>(RENDER_CONFIG.spritePaths.city);
  const supplyTex = await Assets.load<Texture>(RENDER_CONFIG.spritePaths.supplyPost);
  return new TextureFactory(cityTex, supplyTex);
}