// vite.config.ts
// 責務: Vite のビルド／開発サーバ構成を定義する。
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});