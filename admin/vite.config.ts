import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  // 允许 import 上级目录的共享契约 supabase/kyoto.ts
  server: {
    port: 5174,
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
