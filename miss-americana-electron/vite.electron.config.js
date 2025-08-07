import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'electron',
      config: () => ({
        build: {
          outDir: 'dist/renderer',
          rollupOptions: {
            input: {
              main: resolve(__dirname, 'src/renderer/index.html'),
            },
          },
        },
        base: './', // Use relative paths for loading assets
      }),
    },
  ],
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },
});
