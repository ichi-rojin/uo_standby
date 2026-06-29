// 責務: Vite ビルド/開発サーバ設定。
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
  },
});