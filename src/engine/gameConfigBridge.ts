// src/engine/gameConfigBridge.ts
// 責務: engine 層から参照する定数の再エクスポートとシード固定値の提供（循環参照回避の集約点）。

import { CAMERA, SPEED, TIME } from '../config/constants';

export { CAMERA, SPEED, TIME };

export const RENDER_CONFIG_SEED = 20260629;