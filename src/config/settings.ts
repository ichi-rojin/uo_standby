// 責務: 描画モード設定（プロシージャル/外部画像）を切り替える設定
import type { CharacterKind } from '../domain/types';

export type SpriteSource = {
  useExternalImages: boolean;
  textures: Partial<Record<CharacterKind, string>>;
  cityTexture: string | null;
  villageTexture: string | null;
  tileTextures: string[];
};

export const SPRITE_SETTINGS: SpriteSource = {
  useExternalImages: false,
  textures: {},
  cityTexture: null,
  villageTexture: null,
  tileTextures: [],
};