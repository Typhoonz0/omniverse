const raw = process.argv.find(a => a.startsWith("--settings="));
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omniverse", {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (newSettings) => ipcRenderer.invoke("save-settings", newSettings),
});
