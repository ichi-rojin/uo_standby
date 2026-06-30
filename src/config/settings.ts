// 責務: プロシージャル描画/外部画像参照を切り替える設定
export interface AssetSetting {
  useExternalImage: boolean;
  texturePath: string;
}

export interface GameSettings {
  npcAsset: AssetSetting;
  monsterAsset: AssetSetting;
  cityAsset: AssetSetting;
  supplyAsset: AssetSetting;
}

export const defaultSettings: GameSettings = {
  npcAsset: { useExternalImage: false, texturePath: '' },
  monsterAsset: { useExternalImage: false, texturePath: '' },
  cityAsset: { useExternalImage: false, texturePath: '' },
  supplyAsset: { useExternalImage: false, texturePath: '' }
};