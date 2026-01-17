const { app, BrowserWindow, Menu } = require("electron")
const path = require("path")

let mainWindow
let nextServer

async function startNextServer() {
  if (process.env.NODE_ENV !== "development") {
    const next = require("next")
    const nextApp = next({
      dev: false,
      dir: app.getAppPath(),
    })

    await nextApp.prepare()
    const handle = nextApp.getRequestHandler()

    const { createServer } = require("http")
    nextServer = createServer((req, res) => {
      handle(req, res)
    })

    await new Promise((resolve) => {
      nextServer.listen(3000, () => {
        console.log("> Next.js server running on http://localhost:3000")
        resolve()
      })
    })
  }
}

async function createWindow() {
  if (process.env.NODE_ENV !== "development") {
    await startNextServer()
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: "存股管理系統",
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    backgroundColor: "#0a0a0a",
    show: false,
  })

  const startURL = "http://localhost:3000"

  mainWindow.loadURL(startURL)

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  const template = [
    {
      label: "檔案",
      submenu: [
        {
          label: "重新載入",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.reload(),
        },
        { type: "separator" },
        {
          label: "離開",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "編輯",
      submenu: [
        { label: "復原", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "剪下", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "複製", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "貼上", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "全選", accelerator: "CmdOrCtrl+A", role: "selectAll" },
      ],
    },
    {
      label: "視窗",
      submenu: [
        { label: "最小化", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "關閉", accelerator: "CmdOrCtrl+W", role: "close" },
        { type: "separator" },
        { label: "切換全螢幕", accelerator: "F11", role: "togglefullscreen" },
      ],
    },
    {
      label: "說明",
      submenu: [
        {
          label: "關於存股管理系統",
          click: () => {
            const { dialog } = require("electron")
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "關於存股管理系統",
              message: "存股管理系統 v1.0.0",
              detail: "一個專業的台灣股票投資管理工具\n\n© 2026 版權所有",
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.close()
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
