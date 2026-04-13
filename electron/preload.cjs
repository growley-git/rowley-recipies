const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("rowleyElectron", {
  platform: process.platform,
});
