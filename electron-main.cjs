const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
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

  // Handle "Always on Top" for the floating mode
  ipcMain.on('set-always-on-top', (event, flag) => {
    mainWindow.setAlwaysOnTop(flag, flag ? 'screen-saver' : 'normal');
  });

  // Handle window minimization
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  // Handle window close
  ipcMain.on('close-window', () => {
    app.quit();
  });

  // Handle window resizing for "Mini Mode"
  ipcMain.on('resize-window', (event, { width, height }) => {
    mainWindow.setSize(width, height);
  });
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
