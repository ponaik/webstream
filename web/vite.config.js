import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        lobby: path.resolve(__dirname, 'index.html'),
        main: path.resolve(__dirname, 'player.html'),
      }
    }
  }, 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
});