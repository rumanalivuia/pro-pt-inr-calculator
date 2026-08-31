const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let ipcRegistered = false;

// ── Window state persistence ────────────────────────────────────────────────
// Saved to userData so resizing/moving the window survives restarts.
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const raw = fs.readFileSync(stateFile(), 'utf-8');
    const state = JSON.parse(raw);
    // Clamp to a visible display so a monitor change cannot strand the window.
    const display = screen.getDisplayMatching(state);
    const { x, y, width, height } = display.workArea;
    const w = Math.min(Math.max(state.width || 420, 300), width);
    const h = Math.min(Math.max(state.height || 680, 60), height);
    const cx = Math.min(Math.max(state.x || 0, x), x + width - w);
    const cy = Math.min(Math.max(state.y || 0, y), y + height - h);
    return { width: w, height: h, x: cx, y: cy };
  } catch {
    return { width: 420, height: 680 };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { x, y, width, height } = mainWindow.getBounds();
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ x, y, width, height }));
  } catch (err) {
    console.error('Failed to save window state', err);
  }
}

// ── IPC ─────────────────────────────────────────────────────────────────────
function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.on('set-always-on-top', (event, flag) => {
    mainWindow?.setAlwaysOnTop(flag, flag ? 'screen-saver' : 'normal');
  });

  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('close-window', () => {
    app.quit();
  });

  ipcMain.on('resize-window', (event, { width, height }) => {
    mainWindow?.setSize(width, height);
  });
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    ...state,
    minWidth: 300,
    minHeight: 60,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    alwaysOnTop: false,
    resizable: true,
  });

  // In development, load from the Vite dev server
  // In production, load the built index.html
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  registerIpcHandlers();

  // Persist bounds on resize/move, and flush on close.
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('close', saveWindowState);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
