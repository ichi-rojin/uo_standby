// src/config/renderConfig.ts
// 責務: プロシージャル描画と外部画像参照の切替設定を提供する。
//       外部画像を使う場合は useExternalSprites を true にし、各パスを指定する。

export interface ExternalSpritePaths {
  city: string;
  supplyPost: string;
  npc: string;
  monster: string;
}

export interface RenderConfig {
  useExternalSprites: boolean;
  spritePaths: ExternalSpritePaths;
  backgroundColor: number;
}

export const RENDER_CONFIG: RenderConfig = {
  useExternalSprites: false,
  spritePaths: {
    city: 'assets/city.png',
    supplyPost: 'assets/supply.png',
    npc: 'assets/npc.png',
    monster: 'assets/monster.png',
  },
  backgroundColor: 0x10141c,
};