/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Vercel sets VERCEL=1 during cloud builds → root-absolute assets.
  // Locally and in Electron we keep relative assets (loadFile needs './').
  const isVercel = process.env.VERCEL === '1';
  return {
    base: isVercel ? '/' : './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
