const { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 620,
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 350,
    minHeight: 500,
    maxWidth: 500,
    maxHeight: 800,
    alwaysOnTop: true,
    skipTaskbar: true, // Ne pas afficher dans la barre des tâches
    show: false, // Démarrer caché
    x: width - 420,
    y: height - 620,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Charger l'app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  // Empêcher la fermeture, juste cacher
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Raccourci global pour afficher/masquer
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    toggleWindow();
  });
}

function createTray() {
  // Créer l'icône du system tray
  const iconPath = path.join(__dirname, app.isPackaged ? '../dist/icon.png' : '../public/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Afficher DropManager',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Masquer',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Démarrer au lancement',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('DropManager');
  tray.setContextMenu(contextMenu);

  // Double-clic pour afficher
  tray.on('double-click', () => {
    toggleWindow();
  });
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// IPC Handlers
ipcMain.on('close-window', () => {
  mainWindow.hide();
});

ipcMain.on('minimize-window', () => {
  mainWindow.hide();
});

ipcMain.on('show-window', () => {
  mainWindow.show();
  mainWindow.focus();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Définir l'app pour démarrer au lancement (optionnel)
  // app.setLoginItemSettings({
  //   openAtLogin: true,
  //   openAsHidden: true
  // });
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Empêcher la fermeture
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// macOS : réactiver l'app
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});