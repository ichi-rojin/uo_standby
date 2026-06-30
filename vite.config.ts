// File: vite.config.ts
// 責務: Viteビルド設定。開発サーバ・ビルド出力の構成を定義する。

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: true,
  },
});