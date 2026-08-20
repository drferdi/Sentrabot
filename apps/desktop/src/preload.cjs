const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rakazoDesktop", {
  platform: process.platform,
  window: {
    close: () => ipcRenderer.invoke("desktop.window.close"),
    minimize: () => ipcRenderer.invoke("desktop.window.minimize"),
    toggleMaximize: () => ipcRenderer.invoke("desktop.window.toggleMaximize"),
    state: () => ipcRenderer.invoke("desktop.window.state"),
  },
});
