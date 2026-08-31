# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pro PT/INR Calculator** - A professional Electron desktop application for calculating Prothrombin Time (PT) and International Normalized Ratio (INR) for clinical use. Built with React 19, TypeScript, Vite, and Tailwind CSS v4.

## Architecture

```
pro-pt_inr-calculator/
├── electron-main.cjs      # Electron main process (CommonJS)
├── preload.cjs            # Preload script - exposes IPC to renderer
├── src/
│   ├── App.tsx            # Main React component (INR calculator UI + logic)
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind CSS v4 + custom styles
├── index.html             # HTML template
├── vite.config.ts         # Vite + React + Tailwind config
├── tsconfig.json          # TypeScript config (strict, ES2022)
└── package.json           # Scripts, deps, electron-builder config
```

**Process Model:**
- **Main Process** (`electron-main.cjs`): Creates `BrowserWindow`, loads React app (dev: `http://localhost:3000`, prod: `dist/index.html`), handles IPC for window controls (always-on-top, minimize, resize, close)
- **Preload** (`preload.cjs`): Secure bridge exposing `ipcRenderer.send/on` to renderer via `contextBridge`
- **Renderer** (`src/App.tsx`): Full React app with INR calculation, history (localStorage), dark/light theme, PWA install, floating/minimized window modes

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite on port 3000)
npm run dev

# Run Electron in development mode (loads from Vite dev server)
npm run electron:dev

# Type-check only (no emit)
npm run lint

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Package Electron app (outputs to dist-electron/)
npm run electron:build

# Package without installer (unpacked directory)
npm run electron:pack

# Clean build artifacts
npm run clean
```

## Key Configuration

**Vite** (`vite.config.ts`): React plugin, Tailwind v4 plugin, port 3000, host 0.0.0.0

**TypeScript** (`tsconfig.json`): Strict mode, ES2022, React JSX, moduleResolution bundler, isolatedModules

**Electron Builder** (`package.json` > `build`):
- Output: `dist-electron/`
- Files: `dist/**/*`, `electron-main.cjs`, `preload.cjs`
- Windows: NSIS installer, icon `build/icon.ico`
- macOS: DMG, icon `build/icon.png`
- Linux: AppImage, icon `build/icon.png`

## IPC Channels (Main ↔ Renderer)

| Channel | Direction | Payload | Purpose |
|---------|-----------|---------|---------|
| `set-always-on-top` | Renderer → Main | `boolean` | Toggle window always-on-top |
| `minimize-window` | Renderer → Main | — | Minimize to taskbar |
| `close-window` | Renderer → Main | — | Quit app |
| `resize-window` | Renderer → Main | `{width, height}` | Resize for float/minimized modes |

## Data Persistence

All settings and history stored in `localStorage`:
- `inr_history` - Array of calculation entries (max 20)
- `inr_control_pt` - Control PT value
- `inr_isi` - ISI value

## INR Calculation Formula

```
INR = (Patient PT / Control PT) ^ ISI
```

Clinical interpretation thresholds:
- < 0.8: Low
- 0.8–1.2: Normal
- 1.2–2.0: Elevated
- 2.0–3.0: Therapeutic
- 3.0–4.0: High
- 4.0–5.0: Very High
- > 5.0: CRITICAL

## Styling

- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Custom CSS variables for theming (`--bg`, `--surface`, `--accent`, etc.)
- Dark/light mode via `document.body.classList.toggle('light')`
- Framer Motion (`motion/react`) for animations
- Lucide React for icons

## Windows Development Note

The `clean` script uses `rm -rf` which requires Git Bash / WSL / PowerShell with Unix tools. On native PowerShell use `Remove-Item -Recurse -Force dist` instead.

## Electron App Icons

Electron Builder requires icons at:
- `build/icon.ico` (Windows NSIS installer) - 256x256 ICO with multiple sizes
- `build/icon.png` (macOS DMG, Linux AppImage) - 512x512 PNG

Create `build/` directory and add these files before running `npm run electron:build`. Icons can be generated from a source image using tools like Canva, ImageMagick, or online converters.