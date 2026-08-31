const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of channels the renderer may use. Anything else is silently
// dropped — the renderer never gets raw ipcRenderer access.
const VALID_CHANNELS = ['set-always-on-top', 'minimize-window', 'close-window', 'resize-window'];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
