<div align="center">

# Pro PT/INR Calculator

**Professional Prothrombin Time (PT) and International Normalized Ratio (INR) calculator for clinical use.**

A cross-platform desktop app built with Electron, React 19, TypeScript, and Tailwind CSS v4.

</div>

## Features

- **Instant INR calculation** — `INR = (Patient PT / Control PT) ^ ISI`
- **Clinical interpretation** — automatic status band (Normal → Therapeutic → CRITICAL) with color coding
- **Calculation history** — last 20 entries persisted in localStorage
- **Dark / light theme** — toggleable, persisted
- **Always-on-top pinning** — keep the calculator above other windows
- **Floating / minimized window modes** — compact window for on-the-go use
- **PWA installable** — works as a desktop web app too

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
├── preload.cjs            # Preload script — exposes IPC to renderer
├── src/
│   ├── App.tsx            # Main React component (INR calculator UI + logic)
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind CSS v4 + custom styles
├── index.html             # HTML template
├── vite.config.ts         # Vite + React + Tailwind config
├── tsconfig.json          # TypeScript config (strict, ES2022)
└── package.json           # Scripts, deps, electron-builder config
```

- **Main process** — creates the `BrowserWindow`, loads the React app, handles IPC for window controls (always-on-top, minimize, resize, close)
- **Preload** — secure bridge exposing `ipcRenderer.send/on` to the renderer via `contextBridge`
- **Renderer** — full React app with INR calculation, history, theming, PWA install, floating/minimized modes

## Data Persistence

All settings and history are stored in `localStorage`:

- `inr_history` — Array of calculation entries (max 20)
- `inr_control_pt` — Control PT value
- `inr_isi` — ISI value

## License

[MIT](./LICENSE) © [Ruman Ali Vuia](https://github.com/rumanalivuia)
