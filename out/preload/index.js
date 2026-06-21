"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  unlockApp: () => electron.ipcRenderer.send("unlock-app")
});
