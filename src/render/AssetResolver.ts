// 責務: 外部画像参照の有無を一元管理。設定で簡単に画像へ差し替え可能にする。
// 画像パスが設定されていればテクスチャを返し、無ければプロシージャル描画にフォールバック。

import { Assets, Texture } from 'pixi.js';

/** 各描画対象に対する外部画像パス設定。空(undefined)ならプロシージャル描画。 */
export interface AssetConfig {
  npc?: string;
  monster?: string;
  city?: string;
  supplyPost?: string;
  fort?: string;
  terrainGrass?: string;
  terrainWater?: string;
  terrainSand?: string;
  terrainMountain?: string;
}

/** ここを編集するだけで外部画像へ差し替え可能(デフォルトは全てプロシージャル) */
export const ASSET_CONFIG: AssetConfig = {};

export class AssetResolver {
  private readonly cache: Map<string, Texture> = new Map();

  async preload(config: AssetConfig): Promise<void> {
    const entries = Object.values(config).filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    );
    for (const path of entries) {
      if (!this.cache.has(path)) {
        const tex = await Assets.load<Texture>(path);
        this.cache.set(path, tex);
      }
    }
  }

  /** 設定された画像があればTextureを、無ければnullを返す */
  get(path: string | undefined): Texture | null {
    if (!path) {
      return null;
    }
    return this.cache.get(path) ?? null;
  }
}