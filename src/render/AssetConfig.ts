// File: src/render/AssetConfig.ts
// 責務: 外部画像参照の設定。設定で画像を指定するとプロシージャル描画を置換できる。

export interface AssetEntry {
  enabled: boolean;
  url: string;
}

export interface AssetSet {
  npc: AssetEntry;
  monster: AssetEntry;
  boss: AssetEntry;
  city: AssetEntry;
  supply: AssetEntry;
}

// enabled を true にし url を設定すると外部画像が使用される。
// 既定では全て無効でプロシージャル描画が採用される。
export const Assets: AssetSet = {
  npc: { enabled: false, url: '' },
  monster: { enabled: false, url: '' },
  boss: { enabled: false, url: '' },
  city: { enabled: false, url: '' },
  supply: { enabled: false, url: '' },
};