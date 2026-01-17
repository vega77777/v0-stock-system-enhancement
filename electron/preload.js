// Preload script for future enhancements
const { contextBridge } = require("electron")

contextBridge.exposeInMainWorld("electron", {
  // 未來可以在這裡加入需要的 API
})
