/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Strict Content Security Policy. The app is fully self-contained (no CDN,
// fonts, or external resources), so 'self' covers everything. Inline styles
// are required by Tailwind/motion; the service worker registration was moved
// to a real file so no inline scripts are needed.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function cspMetaPlugin(): Plugin {
  return {
    name: 'inject-csp-meta',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {'http-equiv': 'Content-Security-Policy', content: CSP},
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

export default defineConfig(() => {
  // Vercel sets VERCEL=1 during cloud builds → root-absolute assets.
  // Locally and in Electron we keep relative assets (loadFile needs './').
  const isVercel = process.env.VERCEL === '1';
  return {
    base: isVercel ? '/' : './',
    plugins: [react(), tailwindcss(), cspMetaPlugin()],
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
