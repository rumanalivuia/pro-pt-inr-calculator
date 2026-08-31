<div align="center">

# Pro PT/INR Calculator

**Professional Prothrombin Time (PT) and International Normalized Ratio (INR) calculator for clinical use.**

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000000?logo=vercel)](https://pro-ptinr-calculator.vercel.app)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)

**Try it live:** [pro-ptinr-calculator.vercel.app](https://pro-ptinr-calculator.vercel.app)

</div>

## Overview

A cross-platform clinical utility for calculating Prothrombin Time (PT) and International Normalized Ratio (INR), built with React 19, TypeScript, Vite, and Tailwind CSS v4.

Runs in **three ways**:

- **Web / PWA** — hosted on Vercel, installable as a standalone app
- **Desktop** — Electron app for Windows, macOS, and Linux
- **Local dev** — Vite dev server in the browser

## Features

- **Instant INR calculation** — `INR = (Patient PT / Control PT) ^ ISI`
- **Clinical interpretation** — automatic status band (Normal → Therapeutic → CRITICAL) with color coding
- **Calculation history** — last 20 entries persisted in localStorage
- **Dark / light theme** — toggleable, persisted
- **Always-on-top pinning** — keep the calculator above other windows
- **Floating / minimized window modes** — compact window for on-the-go use
- **PWA installable** — installable web app with offline caching
- **Copy-to-clipboard** — INR, Ratio, Index, or full result via buttons or `Ctrl+C` / `Enter`
- **Medical disclaimer & privacy policy** — accessible from the footer

## INR Interpretation

| Range        | Status      |
|--------------|-------------|
| < 0.8        | Low         |
| 0.8 – 1.2    | Normal      |
| 1.2 – 2.0    | Elevated    |
| 2.0 – 3.0    | Therapeutic |
| 3.0 – 4.0    | High        |
| 4.0 – 5.0    | Very High   |
| > 5.0        | CRITICAL    |

> **Clinical note:** This tool is for reference and education. Always follow your institution's protocols and consult a qualified clinician.

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Run in the browser (Vite dev server on port 3000)
npm run dev

# Run as a desktop app (Electron)
npm run electron:dev

# Run tests
npm test
```

## Web Deployment (Vercel)

The web version is deployed to [pro-ptinr-calculator.vercel.app](https://pro-ptinr-calculator.vercel.app), auto-deploying from the `main` branch on every push.

- [`vercel.json`](./vercel.json) — Vite framework preset, SPA rewrite, `no-cache` headers for `sw.js` / `manifest.json`
- The Vite `base` is set to `'/'` on Vercel (via the `VERCEL` env var) and `'./'` locally for Electron's `loadFile`

```bash
# Deploy manually with the Vercel CLI (alternative to Git auto-deploy)
vercel --prod
```

## Building

```bash
# Type-check
npm run lint

# Build the renderer to dist/
npm run build

# Package installers (Windows NSIS, macOS DMG, Linux AppImage)
npm run electron:build

# Package without installer (unpacked directory)
npm run electron:pack
```

Installers are written to `dist-electron/`.

## Architecture

```
pro-pt-inr-calculator/
├── electron-main.cjs      # Electron main process (CommonJS)
├── preload.cjs            # Preload script — whitelisted IPC bridge
├── src/
│   ├── App.tsx            # Main React component (state + orchestration)
│   ├── main.tsx           # React entry point
│   ├── index.css          # Tailwind CSS v4 + custom styles
│   ├── lib/               # Pure logic (INR calc, validation) + tests
│   └── components/        # UI components (TitleBar, ResultCard, HistoryPanel, …)
├── public/
│   ├── manifest.json      # PWA manifest (local icons)
│   └── sw.js              # Service worker (runtime cache, v2)
├── index.html             # HTML template
├── vite.config.ts         # Vite + React + Tailwind + test config
├── vercel.json            # Vercel deployment config
└── package.json           # Scripts, deps, electron-builder config
```

- **Main process** — creates the `BrowserWindow`, loads the React app, handles IPC for window controls, persists window state
- **Preload** — secure bridge exposing a whitelisted `electronAPI` (only known channels pass through)
- **Renderer** — full React app with INR calculation, history, theming, PWA install, floating/minimized modes

## Testing

Unit tests live alongside the logic in `src/lib/` and are run with [Vitest](https://vitest.dev/):

```bash
npm test        # run once
npm run test:watch  # watch mode
```

Coverage includes the INR formula, all status-band thresholds, boundary values, and invalid-input handling.

## Data Persistence

All settings and history are stored in `localStorage`:

- `inr_history` — Array of calculation entries (max 20)
- `inr_control_pt` — Control PT value
- `inr_isi` — ISI value

## Support

Pro PT/INR Calculator is free, ad-free, and developed independently. If you find it useful, consider supporting its ongoing development:

- [GitHub Sponsors](https://github.com/sponsors/rumanalivuia)
- [Ko-fi](https://ko-fi.com/rumanalivuia)

## License

[MIT](./LICENSE) © [Ruman Ali Vuia](https://github.com/rumanalivuia)
